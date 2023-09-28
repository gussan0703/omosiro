from flask_sqlalchemy import SQLAlchemy
from flask import Flask, render_template, request, redirect, flash, url_for
import os
from datetime import datetime
from flask_migrate import Migrate
from flask import jsonify
from datetime import datetime, timedelta


app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'employees.db')
app.config['SECRET_KEY'] = 'lawson_0721'
db = SQLAlchemy(app)
migrate = Migrate(app, db)

class Employee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    category = db.Column(db.String(80), nullable=False)

class EmployeeDetail(db.Model): 
    __tablename__ = 'employee_detail'
    id = db.Column(db.Integer, primary_key=True)
    project_name = db.Column(db.String(80), nullable=False)
    overview = db.Column(db.String(255), nullable=True)
    period = db.Column(db.String(80), nullable=False)
    price = db.Column(db.Float, nullable=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)
    employee = db.relationship('Employee', backref='employee_details')  # これを追加
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    memo = db.Column(db.String(255), nullable=True)


#社員の登録
@app.route('/add_employee', methods=['POST'])
def add_employee():
    name = request.form.get('employee_name')
    category = request.form.get('category')
    
    if not name or not category:
        flash('名前とカテゴリーは必須です', 'error')
        return redirect(url_for('index'))

    new_employee = Employee(name=name, category=category)
    db.session.add(new_employee)
    db.session.commit()

    flash(f'{name}を追加しました', 'success')
    return redirect(url_for('index'))

@app.route('/')
@app.route('/<category>')
def index(category=None):
    if category and category in ['エンジニア', '通信']:
        employees = Employee.query.filter_by(category=category).all()
    else:
        employees = Employee.query.all()
    return render_template('index.html', employees=employees, current_category=category)


#社員の削除
@app.route('/delete_employee/<int:id>', methods=['POST'])
def delete_employee(id):
    employee = Employee.query.get_or_404(id)
    
    # この社員に関連するEmployeeDetailも削除
    for detail in employee.employee_details:
        db.session.delete(detail)

    db.session.delete(employee)
    db.session.commit()
    
    flash(f'{employee.name}を削除しました', 'success')
    return redirect(url_for('index'))


# 社員の編集について
@app.route('/employee_detail/<int:id>', methods=['GET', 'POST'])
def employee_detail(id):
    employee = Employee.query.get_or_404(id)
    detail = EmployeeDetail.query.filter_by(employee_id=id).first()

    if request.method == 'POST':
        name = request.form.get('employee_name')
        category = request.form.get('category')
        project_name = request.form.get('project_name')
        overview = request.form.get('overview')
        price = request.form.get('price')
        start_date_str = request.form.get('start_date')
        end_date_str = request.form.get('end_date')
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date() if start_date_str else None
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date() if end_date_str else None
        period = f"{start_date_str} から {end_date_str}"
        memo = request.form.get('memo')


        if not name or not category:
            flash('名前とカテゴリーは必須です', 'error')
            return render_template('employee_detail.html', employee=employee, detail=detail)

        employee.name = name
        employee.category = category

        if detail:
            detail.project_name = project_name
            detail.overview = overview
            detail.period = period
            detail.price = float(price)
            detail.start_date = start_date
            detail.end_date = end_date
            detail.memo = memo
        else:
            new_detail = EmployeeDetail(project_name=project_name, overview=overview, start_date=start_date,end_date=end_date,period=period, price=float(price), employee_id=employee.id,memo=memo)
            db.session.add(new_detail)

        db.session.commit()

        flash(f'{name}の情報を更新しました', 'success')
        return redirect(url_for('index'))

    return render_template('employee_detail.html', employee=employee, detail=detail)

@app.route('/api/employee_periods')
def api_employee_periods():
    try:
        # 現在の月を取得
        current_month = datetime.today().month
        current_year = datetime.today().year
        # 今後6ヶ月間の期間内のイベントをフィルタリングするための終了日を計算します
        end_month = current_month + 12
        end_year = current_year
        if end_month > 12:
            end_month -= 12
            end_year += 1

        # 今の月から6ヶ月間のdetailsを取得

        # details = EmployeeDetail.query.filter(
        #     EmployeeDetail.start_date >= datetime(current_year, current_month, 1),
        #     EmployeeDetail.start_date < datetime(end_year, end_month, 1)
        # ).all()
        
        details = EmployeeDetail.query.all()
   
        colors = ['#3498DB', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6']  # ここで使いたい色を指定する

        events = [{
            'title': detail.employee.name,
            'start': detail.start_date.strftime('%Y-%m-%d'),
            'end': (detail.end_date + timedelta(days=1)).strftime('%Y-%m-%d'),
            'color': colors[detail.employee_id % len(colors)],
            'employeeId': detail.employee_id,
            'memo': detail.memo
        } for detail in details]
        
        return jsonify(events)
    except Exception as e:
        app.logger.error(f"Error occurred: {str(e)}")
        return jsonify({"error": str(e)}), 500

# データベース初期化の処理
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)
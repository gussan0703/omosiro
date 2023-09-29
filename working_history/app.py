from flask_sqlalchemy import SQLAlchemy
from flask import Flask, render_template, request, redirect, flash, url_for, jsonify
import os
from datetime import datetime, timedelta
from flask_migrate import Migrate

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

class EmployeeMemo(db.Model):
    __tablename__ = 'employee_memo'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)
    memo_month = db.Column(db.String(7), nullable=True)
    memo = db.Column(db.String(255), nullable=True)

class EmployeeDetail(db.Model):
    __tablename__ = 'employee_detail'
    id = db.Column(db.Integer, primary_key=True)
    project_name = db.Column(db.String(80), nullable=False)
    overview = db.Column(db.String(255), nullable=True)
    period = db.Column(db.String(80), nullable=False)
    price = db.Column(db.Float, nullable=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)
    employee = db.relationship('Employee', backref='employee_details')
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)

def isBetween(target, start, end):
    if start and end:
        return start <= target <= end
    return False

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

@app.route('/delete_employee/<int:id>', methods=['POST'])
def delete_employee(id):
    employee = Employee.query.get_or_404(id)
    for detail in employee.employee_details:
        db.session.delete(detail)
    db.session.delete(employee)
    db.session.commit()
    flash(f'{employee.name}を削除しました', 'success')
    return redirect(url_for('index'))

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
        else:
            new_detail = EmployeeDetail(
                project_name=project_name, 
                overview=overview, 
                start_date=start_date,
                end_date=end_date,
                period=period, 
                price=float(price), 
                employee_id=employee.id,
            )
            db.session.add(new_detail)
        db.session.commit()
        flash(f'{name}の情報を更新しました', 'success')
        return redirect(url_for('index'))
    return render_template('employee_detail.html', employee=employee, detail=detail)

@app.route('/update_memo', methods=['POST'])
def update_memo():
    employee_id = request.json.get('employee_id')
    memo_month = request.json.get('memo_month')
    memo = request.json.get('memo')
    memo_record = EmployeeMemo.query.filter_by(employee_id=employee_id, memo_month=memo_month).first()

    if not memo_record and memo:
        new_memo = EmployeeMemo(employee_id=employee_id, memo_month=memo_month, memo=memo)
        db.session.add(new_memo)
    elif memo_record and memo:
        memo_record.memo = memo
    elif memo_record and not memo:
        db.session.delete(memo_record)
    
    db.session.commit()
    return jsonify({'status': 'success'})

@app.route('/delete_memo', methods=['POST'])
def delete_memo():
    employee_id = request.json.get('employee_id')
    memo_month = request.json.get('memo_month')
    memo_record = EmployeeMemo.query.filter_by(employee_id=employee_id, memo_month=memo_month).first()
    if memo_record:
        db.session.delete(memo_record)
        db.session.commit()
        return jsonify({'status': 'success'})
    else:
        return jsonify({'status': 'error', 'message': '該当するメモが見つかりませんでした。'})

@app.route('/api/employee_periods')
def api_employee_periods():
    details = EmployeeDetail.query.all()
    memos = EmployeeMemo.query.all()
    colors = ['#3498DB', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6']

    events = [{
        'title': detail.employee.name,
        'start': detail.start_date.strftime('%Y-%m') if detail.start_date else None,
        'end': detail.end_date.strftime('%Y-%m') if detail.end_date else None,
        'color': colors[detail.employee_id % len(colors)],
        'employeeId': detail.employee_id,
        'project_name': detail.project_name,
        'overview': detail.overview,
        'price': detail.price,
        'memos': []  # メモをリストとして追加
    } for detail in details]

    for event in events:
        # 期間内のすべてのメモを取得
        related_memos = [memo for memo in memos if memo.employee_id == event['employeeId'] and event['start'] <= memo.memo_month <= event['end']]
        for memo_record in related_memos:
            event['memos'].append({
                'memo': memo_record.memo,
                'memo_month': memo_record.memo_month
            })

    return jsonify(events)


if __name__ == '__main__':
    app.run(debug=True)


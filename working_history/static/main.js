function formatDate(dateString) {
    let date = new Date(dateString);
    let yyyy = date.getFullYear();
    let mm = String(date.getMonth() + 1).padStart(2, '0');
    let dd = String(date.getDate()).padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd;
}

document.addEventListener("DOMContentLoaded", function () {
    const currentDate = new Date();

    // APIからデータを取得
    fetch('/api/employee_periods')
        .then(response => response.json())
        .then(data => {
            const events = data.map(event => {
                return {
                    ...event,
                    start: formatDate(event.start),
                    end: formatDate(event.end),
                    title:'',
                    backgroundColor: event.color
                };
            });

            document.querySelectorAll('.employee-calendar').forEach((calendarContainer) => {
                const employeeId = parseInt(calendarContainer.dataset.employeeId);

                // この社員のイベントだけをフィルタリング
                const employeeEvents = events.filter(event => event.employeeId == employeeId);
                
                for(let i = 0; i < 12; i++) {
                    const displayStartDate = new Date(currentDate);
                    displayStartDate.setMonth(currentDate.getMonth() + i);
                    const displayEndDate = new Date(displayStartDate);
                    displayEndDate.setMonth(displayStartDate.getMonth() + 1);
                    displayEndDate.setDate(0);

                    // この月に該当する従業員のイベントを探す
                    const currentMonthEvents = employeeEvents.filter(event => 
                        new Date(event.start) <= displayEndDate && new Date(event.end) >= displayStartDate
                    );

                    const calendarEl = calendarContainer.querySelector('.month-calendar:nth-child(' + (i + 1) + ')');

                    // イベントがある場合、背景色を設定
                    if (currentMonthEvents.length > 0) {
                        calendarEl.style.backgroundColor = currentMonthEvents[0].backgroundColor;
                    }

                    // FullCalendarの初期化
                    var calendar = new FullCalendar.Calendar(calendarEl, {
                        initialView: "dayGrid",
                        dayCellContent: '', 
                        events: employeeEvents, 
                        titleFormat: { month: 'numeric', year: 'numeric' },
                        validRange: {
                            start: displayStartDate.toISOString().slice(0, 7),
                            end: displayEndDate.toISOString().slice(0, 7)
                        },
                        height: 'auto',
                        aspectRatio: 5.5,
                        dayHeaderContent: ''  ,
                        headerToolbar:{
                            right:''
                        },
                        footerToolbar: {
                            left: '',
                            center: '',
                            right: ''
                        }
                    });
                    calendar.render();

                    calendarEl.addEventListener('click', function() {
                        // クリックされたカレンダーに関連するスタッフのイベントを取得
                        let relatedEvents = events.filter(event => event.employeeId == employeeId);
        
                        // 関連するスタッフの情報を表示するロジックをここに書く
                        // 例: アラートで表示
                        relatedEvents.forEach(event => {
                            alert(`スタッフID: ${event.employeeId}, 開始日: ${event.start}, 終了日: ${event.end}`);
                        });
                    });
                }
            });
        });
});

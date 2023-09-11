function formatDate(dateString) {
    let date = new Date(dateString);
    let yyyy = date.getFullYear();
    let mm = String(date.getMonth() + 1).padStart(2, '0');
    return yyyy + '-' + mm;
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
                    end: formatDate(event.end)
                };
            });

            document.querySelectorAll('.employee-calendar').forEach((calendarContainer) => {
                const employeeId = calendarContainer.dataset.employeeId;
                
                // この社員のイベントだけをフィルタリング
                const employeeEvents = events.filter(event => event.employeeId == employeeId);
                
                for(let i = 0; i < 6; i++) {
                    const displayStartDate = new Date(currentDate);
                    displayStartDate.setMonth(currentDate.getMonth() + i);
                    const displayEndDate = new Date(displayStartDate);
                    displayEndDate.setMonth(displayStartDate.getMonth() + 1);
                    displayEndDate.setDate(0);

                    // FullCalendarの初期化
                    const calendarEl = calendarContainer.querySelector('.month-calendar:nth-child(' + (i + 1) + ')');
                    var calendar = new FullCalendar.Calendar(calendarEl, {
                        initialView: "dayGrid",
                        dayCellContent: '', // 日にちを表示しない
                        events: employeeEvents,  // この社員のイベントだけを渡す
                        eventColor: 'blue',
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
                }
            });
        });
});

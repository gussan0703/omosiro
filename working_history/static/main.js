function formatDate(dateString) {
    let date = new Date(dateString);
    let yyyy = date.getFullYear();
    let mm = String(date.getMonth() + 1).padStart(2, '0');
    return yyyy + '-' + mm;
}

function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

document.addEventListener("DOMContentLoaded", function () {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const memoButtons = document.querySelectorAll('.memo-btn');
    memoButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const memoText = prompt("メモを入力してください：", "");
            if (memoText) {
                btn.setAttribute('data-memo', memoText);
            }
        });
    });

    fetch('/api/employee_periods')
        .then(response => response.json())
        .then(data => {
            const events = data.map(event => {
                return {
                    ...event,
                    start: formatDate(event.start),
                    end: formatDate(event.end),
                    title: '',
                    backgroundColor: event.color
                };
            });

            document.querySelectorAll('.employee-calendar').forEach((calendarContainer) => {
                const employeeId = parseInt(calendarContainer.dataset.employeeId);
                const employeeEvents = events.filter(event => event.employeeId == employeeId);

                for (let i = 0; i < 12; i++) {
                    const targetYear = (currentMonth + i) >= 12 ? currentYear + 1 : currentYear;
                    const targetMonth = (currentMonth + i) % 12;
                    const displayStartDate = new Date(targetYear, targetMonth, 1);
                    const displayEndDate = new Date(targetYear, targetMonth + 1, 0);

                    const currentMonthEvents = employeeEvents.filter(event =>
                        new Date(event.start) <= displayEndDate && new Date(event.end) >= displayStartDate
                    );

                    const calendarEl = calendarContainer.querySelector('.month-calendar:nth-child(' + (i + 1) + ')');

                    if (calendarEl) {
                        const monthTitleEl = calendarEl.querySelector('.month-title');
                        const displayMonth = displayStartDate.getMonth() + 1;
                        const displayYear = displayStartDate.getFullYear();
                        monthTitleEl.textContent = `${displayYear}年\n${displayMonth}月`;


                        if (currentMonthEvents.length > 0) {
                            calendarEl.style.backgroundColor = currentMonthEvents[0].backgroundColor;
                        }

                        calendarEl.addEventListener('click', function () {
                            let relatedEvents = events.filter(event => event.employeeId == employeeId);
                            relatedEvents.forEach(event => {
                                alert(`スタッフID: ${event.employeeId}, 開始月: ${event.start}, 終了月: ${event.end}, メモ: ${event.memo || 'なし'}`);
                            });
                        });
                        
                    }
                }
            });
        });
});

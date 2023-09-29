function formatDate(dateString) {
    let date = new Date(dateString);
    let yyyy = date.getFullYear();
    let mm = String(date.getMonth() + 1).padStart(2, '0');
    return yyyy + '-' + mm;
}

document.addEventListener("DOMContentLoaded", function () {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const memoButtons = document.querySelectorAll('.memo-btn');
    let events = [];

    fetch('/api/employee_periods')
        .then(response => response.json())
        .then(data => {
            events = data.map(event => {
                return {
                    ...event,
                    start: formatDate(event.start),
                    end: formatDate(event.end),
                    backgroundColor: event.color,
                    memo_month: event.memo_month
                };
            });

            function isBetween(target, start, end) {
                return target >= start && target <= end;
            }

            memoButtons.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    
                    const employeeId = btn.closest('.employee-calendar').getAttribute('data-employee-id');
                    const monthTitle = btn.parentElement.querySelector('.month-title').textContent.trim();
                    const year = monthTitle.split("年")[0];
                    const month = monthTitle.split("年")[1].split("月")[0];
                    const memoMonthFormat = `${year}-${month.padStart(2, '0')}`;
                
                    let existingMemo = events.find(event => event.employeeId == employeeId && event.memo_month == memoMonthFormat);
                    let memoText = existingMemo ? existingMemo.memo : "";
                    const inputText = "メモを入力してください。メモを消す場合、テキストをすべて削除してOKボタンを押してください:";
                
                    const newMemo = prompt(inputText, memoText);
                
                    if (newMemo && newMemo !== memoText) {
                        // メモの更新
                        const postData = {
                            'employee_detail_id': parseInt(employeeId),
                            'memo_month': memoMonthFormat,
                            'memo': newMemo
                        };
                
                        fetch('/update_memo', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(postData)
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.status !== 'success') {
                                alert('メモの保存に失敗しました。');
                            }
                        });
                    } else if (!newMemo && existingMemo) {
                        // メモの削除
                        const postData = {
                            'employee_detail_id': parseInt(employeeId),
                            'memo_month': memoMonthFormat
                        };
                
                        fetch('/delete_memo', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(postData)
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.status !== 'success') {
                                alert('メモの削除に失敗しました。');
                            }
                        });
                    }
                });
            });
            
            

            document.querySelectorAll('.employee-calendar').forEach((calendarContainer) => {
                const employeeId = parseInt(calendarContainer.dataset.employeeId);
                const employeeEvents = events.filter(event => event.employeeId == employeeId);

                for (let i = 0; i < 12; i++) {
                    const targetMonth = (currentMonth + i) % 12;
                    const targetYear = (currentMonth + i) >= 12 ? currentYear + 1 : currentYear;
                    const calendarEl = calendarContainer.querySelector('.month-calendar:nth-child(' + (i + 1) + ')');

                    const monthTitleEl = calendarEl.querySelector('.month-title');
                    const displayMonth = targetMonth + 1;
                    monthTitleEl.textContent = `${targetYear}年${displayMonth}月`;

                    const memoMonthFormat = `${targetYear}-${displayMonth.toString().padStart(2, '0')}`;
                    const currentMonthEvents = employeeEvents.filter(event => event.memo_month == memoMonthFormat);

                    // 開始月、終了月の色を変更する
                    const withinProjectDuration = employeeEvents.some(event => 
                        isBetween(memoMonthFormat, event.start, event.end)
                    );

                    if (withinProjectDuration) {
                        calendarEl.style.backgroundColor = employeeEvents[0].backgroundColor;
                    }

                    if (currentMonthEvents.length > 0) {
                        const memoBtn = calendarEl.querySelector('.memo-btn');
                        if (memoBtn) {
                            memoBtn.style.color = "red";
                        }
                    }

                    calendarEl.addEventListener('click', function() {
                        let relatedEvents = events.filter(event => event.employeeId == employeeId && event.memo_month == memoMonthFormat);
                
                        relatedEvents.forEach(event => {
                            let startMonth = event.start ? event.start.split('-').slice(0,2).join('-') : '未定';
                            let endMonth = event.end ? event.end.split('-').slice(0,2).join('-') : '未定';
                            
                            alert(`スタッフ名: ${event.title}, メモ: ${event.memo || 'なし'}`);//開始月: ${startMonth}, 終了月: ${endMonth},//
                        });
                        
                        
                    });
                }
            });
        });
});


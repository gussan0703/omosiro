document.addEventListener("DOMContentLoaded", function () {
    let events = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    function isBetween(target, start, end) {
        const targetDate = new Date(target + "-01");
        const startDate = new Date(start + "-01");
        const endDate = new Date(end + "-01");
        return targetDate >= startDate && targetDate <= endDate;
    }

    function fetchAndRenderEvents() {
        fetch('/api/employee_periods')
            .then(response => response.json())
            .then(data => {
                events = data;

                document.querySelectorAll('.employee-calendar').forEach((calendarContainer) => {
                    const employeeId = parseInt(calendarContainer.dataset.employeeId);

                    for (let i = 0; i < 12; i++) {
                        const targetMonth = (currentMonth + i) % 12;
                        const targetYear = (currentMonth + i) >= 12 ? currentYear + 1 : currentYear;
                        const calendarEl = calendarContainer.querySelector(`.month-calendar:nth-child(${i + 1})`);
                        const monthTitleEl = calendarEl.querySelector('.month-title');
                        monthTitleEl.textContent = `${targetYear}年${(targetMonth + 1).toString().padStart(2, '0')}月`;
                        const memoMonthFormat = monthTitleEl.textContent.trim().replace('年', '-').replace('月', '').padStart(7, '0');

                        const withinProjectDuration = events.some(event => 
                            isBetween(memoMonthFormat, event.start, event.end) && event.employeeId === employeeId
                        );

                        if (withinProjectDuration) {
                            calendarEl.style.backgroundColor = events.find(event => event.employeeId === employeeId).color;
                            calendarEl.classList.add('clickable');
                        }

                        const memoBtn = calendarEl.querySelector('.memo-btn');
                        const relatedEmployee = events.find(event => event.employeeId === employeeId);
                        const existingMemo = relatedEmployee ? relatedEmployee.memos.find(memo => memo.memo_month === memoMonthFormat) : null;

                        if (existingMemo) {
                            memoBtn.style.backgroundColor = "red";  // 色を変更
                        } else {
                            memoBtn.style.backgroundColor = "";  // 元の色にリセット
                        }

                        calendarEl.addEventListener('click', function() {
                            if (calendarEl.classList.contains('clickable')) {
                                // 選択した月に関連するイベントを探します。
                                let relatedEvents = events.filter(event => event.employeeId === employeeId && isBetween(memoMonthFormat, event.start, event.end));
                        
                                // 選択した月に対応するメモを探します。
                                const relatedEmployee = events.find(event => event.employeeId === employeeId);
                                const memoEvent = relatedEmployee ? relatedEmployee.memos.find(memo => memo.memo_month === memoMonthFormat) : null;
                                const memo = memoEvent ? memoEvent.memo : 'なし';
                        
                                relatedEvents.forEach(relatedEvent => {
                                    const projectName = relatedEvent.project_name || 'なし';
                                    const overview = relatedEvent.overview || 'なし';
                                    const price = relatedEvent.price || 'なし';
                        
                                    alert(`スタッフ名: ${relatedEvent.title}\nプロジェクト名: ${projectName}\n概要: ${overview}\n価格: ${price}\nメモ: ${memo}`);
                                });
                            }
                        });                        
                        
                        
                    }
                });
            });
    }

    document.querySelectorAll('.memo-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();


            const employeeId = btn.closest('.employee-calendar').getAttribute('data-employee-id');
            const monthTitle = btn.parentElement.querySelector('.month-title').textContent.trim();
            const memoMonthFormat = monthTitle.replace('年', '-').replace('月', '').padStart(7, '0');
                
            const relatedEmployee = events.find(event => event.employeeId.toString() === employeeId);
            const existingMemo = relatedEmployee ? relatedEmployee.memos.find(memo => memo.memo_month === memoMonthFormat) : null;
            const memoText = existingMemo ? existingMemo.memo : "";

            const newMemo = prompt("メモを入力してください。メモを消す場合、テキストをすべて削除してOKボタンを押してください:", memoText);

            if (newMemo !== null) {
                const postData = {
                    'employee_id': parseInt(employeeId),
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
                    console.log("APIからのデータ:", data);
                    if (data.status !== 'success') {
                        alert('メモの保存に失敗しました。');
                    } else {
                        // メモが正常に更新されたら、再度イベントデータを取得して表示を更新
                        fetchAndRenderEvents();
                    }
                });
            }
        });
    });

    // 初回のデータ取得
    fetchAndRenderEvents();
});

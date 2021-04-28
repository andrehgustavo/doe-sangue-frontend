(function ($) {

    "use strict";

    // Setup the calendar with the current date
    $(document).ready(function () {
        var date = new Date();
        var today = date.getDate();
        // Set click handlers for DOM elements
        $(".right-button").click({ date: date }, next_year);
        $(".left-button").click({ date: date }, prev_year);
        $(".month").click({ date: date }, month_click);
        $("#add-button").click({ date: date }, chooseAschedule);
        // Set current month as active
        $(".months-row").children().eq(date.getMonth()).addClass("active-month");
        init_calendar(date);
        //var events = check_events(today, date.getMonth()+1, date.getFullYear());
        //show_events(events, months[date.getMonth()], today);
        var schedules = check_schedule(today, date.getMonth() + 1, date.getFullYear());
        show_schedules(schedules, months[date.getMonth()], today, date.getFullYear());
    });

    // Initialize the calendar by appending the HTML dates
    function init_calendar(date) {
        $(".tbody").empty();
        $(".events-container").empty();
        var calendar_days = $(".tbody");
        var month = date.getMonth();
        var year = date.getFullYear();
        var day_count = days_in_month(month, year);
        var row = $("<tr class='table-row'></tr>");
        var today = date.getDate();
        // Set date to 1 to find the first day of the month
        date.setDate(1);
        var first_day = date.getDay();
        // 35+firstDay is the number of date elements to be added to the dates table
        // 35 is from (7 days in a week) * (up to 5 rows of dates in a month)
        for (var i = 0; i < 35 + first_day; i++) {
            // Since some of the elements will be blank, 
            // need to calculate actual date from index
            var day = i - first_day + 1;
            // If it is a sunday, make a new row
            if (i % 7 === 0) {
                calendar_days.append(row);
                row = $("<tr class='table-row'></tr>");
            }
            // if current index isn't a day in this month, make it blank
            if (i < first_day || day > day_count) {
                var curr_date = $("<td class='table-date nil'>" + "</td>");
                row.append(curr_date);
            }
            else {
                var curr_date = $("<td class='table-date'>" + day + "</td>");
                //var events = check_events(day, month+1, year);
                var schedules = check_schedule(day, month + 1, year);
                if (today === day && $(".active-date").length === 0) {
                    curr_date.addClass("active-date");
                    //show_events(events, months[month], day);
                    show_schedules(schedules, months[month], day);
                }
                // If this date has any events, style it with .event-date
                /* if(events.length!==0) {
                    curr_date.addClass("event-date");
                } */
                if (schedules.length !== 0) {
                    curr_date.addClass("event-date");
                }
                // Set onClick handler for clicking a date
                curr_date.click({ schedules: schedules, month: months[month], day: day }, date_click);
                row.append(curr_date);
            }
        }
        // Append the last row and set the current year
        calendar_days.append(row);
        $(".year").text(year);
    }

    // Get the number of days in a given month/year
    function days_in_month(month, year) {
        var monthStart = new Date(year, month, 1);
        var monthEnd = new Date(year, month + 1, 1);
        return (monthEnd - monthStart) / (1000 * 60 * 60 * 24);
    }

    // Event handler for when a date is clicked
    function date_click(event) {
        $(".events-container").show(250);
        $("#dialog").hide(250);
        $(".active-date").removeClass("active-date");
        $(this).addClass("active-date");
        //show_events(event.data.events, event.data.month, event.data.day);
        console.log("event.data")
        console.log(event.data)
        show_schedules(event.data.schedules, event.data.month, event.data.day);
    };

    // Event handler for when a month is clicked
    function month_click(event) {
        $(".events-container").show(250);
        $("#dialog").hide(250);
        var date = event.data.date;
        $(".active-month").removeClass("active-month");
        $(this).addClass("active-month");
        var new_month = $(".month").index(this);
        date.setMonth(new_month);
        init_calendar(date);
    }

    // Event handler for when the year right-button is clicked
    function next_year(event) {
        $("#dialog").hide(250);
        var date = event.data.date;
        var new_year = date.getFullYear() + 1;
        $("year").html(new_year);
        date.setFullYear(new_year);
        init_calendar(date);
    }

    // Event handler for when the year left-button is clicked
    function prev_year(event) {
        $("#dialog").hide(250);
        var date = event.data.date;
        var new_year = date.getFullYear() - 1;
        $("year").html(new_year);
        date.setFullYear(new_year);
        init_calendar(date);
    }

    // Event handler for clicking the new event button
    function new_event(event) {
        // if a date isn't selected then do nothing
        if ($(".active-date").length === 0)
            return;
        // remove red error input on click
        $("input").click(function () {
            $(this).removeClass("error-input");
        })
        // empty inputs and hide events
        $("#dialog input[type=text]").val('');
        $("#dialog input[type=number]").val('');
        $(".events-container").hide(250);
        $("#dialog").show(250);
        // Event handler for cancel button
        $("#cancel-button").click(function () {
            $("#name").removeClass("error-input");
            $("#count").removeClass("error-input");
            $("#dialog").hide(250);
            $(".events-container").show(250);
        });
        // Event handler for ok button
        $("#ok-button").unbind().click({ date: event.data.date }, function () {
            var date = event.data.date;
            var name = "Admin";
            var count = parseInt($("#count").val().trim());
            var day = parseInt($(".active-date").html());
            // Basic form validation
            if (name.length === 0) {
                $("#name").addClass("error-input");
            }
            else if (isNaN(count)) {
                $("#count").addClass("error-input");
            }
            else {
                $("#dialog").hide(250);
                new_event_json(name, count, date, day);
                date.setDate(day);
                init_calendar(date);
            }
        });
    }

    // Adds a json event to event_data
    function new_event_json(name, count, date, day) {
        var event = {
            "occasion": name,
            "invited_count": count,
            "year": date.getFullYear(),
            "month": date.getMonth() + 1,
            "day": day
        };
        event_data["events"].push(event);
    }

    // Display all events of the selected date in card views
    function show_events(events, month, day) {
        // Clear the dates container
        $(".events-container").empty();
        $(".events-container").show(250);
        console.log(event_data["events"]);
        // If there are no events for this date, notify the user
        if (events.length === 0) {
            var event_card = $("<div class='event-card'></div>");
            var event_name = $("<div class='event-name'>Não há doações agendadas para o dia " + day + " " + month + ".</div>");
            $(event_card).css({ "border-left": "10px solid #FF1744" });
            $(event_card).append(event_name);
            $(".events-container").append(event_card);
        }
        else {
            // Go through and add each event as a card to the events container
            for (var i = 0; i < events.length; i++) {
                var event_card = $("<div class='event-card'></div>");
                var event_count = $("<div class='event-count'>Hora: " + events[i]["invited_count"] + "</div>");
                var event_name = $("<div class='event-name'>Doador: " + events[i]["occasion"] + "</div>");
                if (events[i]["cancelled"] === true) {
                    $(event_card).css({
                        "border-left": "10px solid #FF1744"
                    });
                    event_count = $("<div class='event-cancelled'>Cancelled</div>");
                }
                $(event_card).append(event_count).append(event_name);
                $(".events-container").append(event_card);
            }
        }
    }
    // Display all events of the selected date in card views
    function show_schedules(schedules, month, day, year) {
        // Clear the dates container
        $(".events-container").empty();
        $(".events-container").show(250);
        let available_schedules = [];
        available_schedules = check_available(schedules);
        var form_card = $("<form onsubmit='myFunction()'> </form>")
        for (var i = 0; i < available_schedules.length; i++) {

            var label_card = $("<label class='label-radio'></label>");
            var input_radio = $("<input type='radio' name='product' class='card-input-element'/> ");
            $(input_radio).val(available_schedules[i]["hour"])
            var event_card = $("<div class='panel panel-default card-input'></div>");
            var event_count = $("<div class='panel-heading'>Hora: " + available_schedules[i]["hour"] + "</div>");
            if (available_schedules[i]["available"]) {
                var event_name = $("<div class='panel-body'>Disponível</div>");
                $(event_card).css({ "border": "1px solid #28a745" });
            } else {
                var event_name = $("<div class='panel-body'> " + available_schedules[i]["donator"] + "</div>");
                $(event_card).css({ "border": "1px solid #FF1744" });
            }
            $(event_card).append(event_count).append(event_name);
            $(label_card).append(input_radio);
            $(label_card).append(event_card);
            $(form_card).append(label_card);


        }
        $(".events-container").append(form_card);

    }
    function chooseAschedule() {
        if (document.querySelector('input[name="product"]:checked') === null) {
            alert("Escolha um dos horários!")
        } else {
            const hour = document.querySelector('input[name="product"]:checked').value;
            var day = parseInt($(".active-date").html());
            var month = returnMonth($(".active-month").html());
            const available = true;
            for (let j = 0; j < schedules_data["schedules"].length; j++) {
                if (schedules_data["schedules"][j]["hour"] === hour &&
                    schedules_data["schedules"][j]["day"] === day &&
                    schedules_data["schedules"][j]["month"] === month) {
                    alert("Horário indisponível. Escolha um outro horário.")
                    available = false;
                }
            }
            if (available) {
                var answer = window.confirm("Você escolheu o dia " + day + "/" + month + "/" + "2021 no horário das " + hour + ". Tem certeza que deseja agendar nessa data?");
                if (answer) {
                    schedules_data["schedules"].push(
                        {
                            "year": 2021,
                            "month": month,
                            "day": day,
                            "hour": hour,
                            "available": false,
                            "donator": "Admin"
                        }
                    )
                    console.log("final schedules_data")
                    console.log(schedules_data)
                    let date = new Date(2021, month - 1, day);
                    console.log("final date")
                    console.log(date)
                    init_calendar(date)
                }
                else {
                    alert("Escolha um novo horário e data!")
                }
                
            }
        }
    }
    function check_available(schedules, day, month, year) {
        console.log("check schedules")
        console.log(schedules)
        let local_schedules = [{
            "hour": "08:00",
            "available": true,
        },
        {
            "hour": "08:30",
            "available": true,
        },
        {
            "hour": "09:00",
            "available": true,
        },
        {
            "hour": "09:30",
            "available": true,
        },
        {
            "hour": "10:00",
            "available": true,
        },
        {
            "hour": "10:30",
            "available": true,
        },
        {
            "hour": "11:00",
            "available": true,
        },
        {
            "hour": "11:30",
            "available": true,
        },
        {
            "hour": "14:00",
            "available": true,
        },
        {
            "hour": "14:30",
            "available": true,
        },
        {
            "hour": "15:00",
            "available": true,
        },
        {
            "hour": "15:30",
            "available": true,
        },
        {
            "hour": "16:00",
            "available": true,
        },
        {
            "hour": "16:30",
            "available": true,
        },
        {
            "hour": "17:00",
            "available": true,
        },
        {
            "hour": "17:30",
            "available": true,
        },
        {
            "hour": "18:00",
            "available": true,
        },
        {
            "hour": "18:30",
            "available": true,
        }];
        console.log("check local_schedules")
        console.log(local_schedules)
        for (let i = 0; i < local_schedules.length; i++) {
            for (let j = 0; j < schedules.length; j++) {
                if (local_schedules[i]["hour"] === schedules[j]["hour"]) {
                    local_schedules[i]["hour"] = schedules[j]["hour"]
                    local_schedules[i]["donator"] = schedules[j]["donator"]
                    local_schedules[i]["available"] = false
                    local_schedules[i]["day"] = schedules[j]["day"]
                    local_schedules[i]["month"] = schedules[j]["month"]
                    local_schedules[i]["year"] = schedules[j]["year"]
                }
            }
        }
        console.log("local_schedules")
        console.log(local_schedules)
        return local_schedules;
    }
    // Checks if a specific date has schedule
    function check_schedule(day, month, year) {
        var schedules = [];
        console.log("month");
        console.log(day, month, year);
        for (var i = 0; i < schedules_data["schedules"].length; i++) {
            var schedule = schedules_data["schedules"][i];
            console.log(schedule);
            if (schedule["day"] === day &&
                schedule["month"] === month &&
                schedule["year"] === year) {
                schedules.push(schedule);
            }
        }
        console.log("schedules")
        console.log(schedules)
        return schedules;
    }
    // Checks if a specific date has any events
    function check_events(day, month, year) {
        var events = [];
        for (var i = 0; i < event_data["events"].length; i++) {
            var event = event_data["events"][i];
            if (event["day"] === day &&
                event["month"] === month &&
                event["year"] === year) {
                events.push(event);
            }
        }
        return events;
    }
    // Given data for hours in JSON format
    var schedules_data = {
        "schedules": [
            {
                "year": 2021,
                "month": 4,
                "day": 27,
                "hour": "08:00",
                "available": false,
                "donator": "Chico"
            },
            {
                "year": 2021,
                "month": 4,
                "day": 27,
                "hour": "08:30",
                "available": false,
                "donator": "Maria"
            },
            {
                "year": 2021,
                "month": 4,
                "day": 28,
                "hour": "10:30",
                "available": false,
                "donator": "Maria"
            },
            {
                "year": 2021,
                "month": 5,
                "day": 15,
                "hour": "15:30",
                "available": false,
                "donator": "Maria"
            },
            {
                "year": 2021,
                "month": 5,
                "day": 6,
                "hour": "15:30",
                "available": false,
                "donator": "Maria"
            }
        ]
    }
    // Given data for events in JSON format
    var event_data = {
        "events": [
            {
                "occasion": " Repeated Test Event ",
                "invited_count": 120,
                "year": 2021,
                "month": 4,
                "day": 27,
                "cancelled": true
            },
            {
                "occasion": " Repeated Test Event ",
                "invited_count": 120,
                "year": 2020,
                "month": 5,
                "day": 10,
                "cancelled": true
            },
            {
                "occasion": " Repeated Test Event ",
                "invited_count": 120,
                "year": 2020,
                "month": 5,
                "day": 10,
                "cancelled": true
            },
            {
                "occasion": " Repeated Test Event ",
                "invited_count": 120,
                "year": 2020,
                "month": 5,
                "day": 10
            },
            {
                "occasion": " Repeated Test Event ",
                "invited_count": 120,
                "year": 2020,
                "month": 5,
                "day": 10,
                "cancelled": true
            },
            {
                "occasion": " Repeated Test Event ",
                "invited_count": 120,
                "year": 2020,
                "month": 5,
                "day": 10
            },
            {
                "occasion": " Repeated Test Event ",
                "invited_count": 120,
                "year": 2020,
                "month": 5,
                "day": 10,
                "cancelled": true
            },
            {
                "occasion": " Repeated Test Event ",
                "invited_count": 120,
                "year": 2020,
                "month": 5,
                "day": 10
            },
            {
                "occasion": " Repeated Test Event ",
                "invited_count": 120,
                "year": 2020,
                "month": 5,
                "day": 10,
                "cancelled": true
            },
            {
                "occasion": " Repeated Test Event ",
                "invited_count": 120,
                "year": 2020,
                "month": 5,
                "day": 10
            },
            {
                "occasion": " Test Event",
                "invited_count": 120,
                "year": 2020,
                "month": 5,
                "day": 11
            }
        ]
    };

    const hours = [
        {
            "hour": "08:00",
            "available": true,
        },
        {
            "hour": "08:30",
            "available": true,
        },
        {
            "hour": "09:00",
            "available": true,
        },
        {
            "hour": "09:30",
            "available": true,
        },
        {
            "hour": "10:00",
            "available": true,
        },
        {
            "hour": "10:30",
            "available": true,
        },
        {
            "hour": "11:00",
            "available": true,
        },
        {
            "hour": "11:30",
            "available": true,
        },
        {
            "hour": "14:00",
            "available": true,
        },
        {
            "hour": "14:30",
            "available": true,
        },
        {
            "hour": "15:00",
            "available": true,
        },
        {
            "hour": "15:30",
            "available": true,
        },
        {
            "hour": "16:00",
            "available": true,
        },
        {
            "hour": "16:30",
            "available": true,
        },
        {
            "hour": "17:00",
            "available": true,
        },
        {
            "hour": "17:30",
            "available": true,
        },
        {
            "hour": "18:00",
            "available": true,
        },
        {
            "hour": "18:30",
            "available": true,
        }
    ]

    const months = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro"
    ];

    function returnMonth(month) {
        switch (month) {
            case "Jan":
                return 1;
                break;
            case "Fev":
                return 2;
                break;
            case "Mar":
                return 3;
                break;
            case "Abr":
                return 4;
                break;
            case "Mai":
                return 5;
                break;
            case "Jun":
                return 6;
                break;
            case "Jul":
                return 7;
                break;
            case "Ago":
                return 8;
                break;
            case "Set":
                return 9;
                break;
            case "Out":
                return 10;
                break;
            case "Nov":
                return 11;
                break;
            case "Dez":
                return 12;
                break;

            default:
                return "";
                break;
        }
    }


})(jQuery);

$("#finish-button").click(function () {
    alert("Todo o sistema foi testado. Obrigado. Porfavor, responda o questionário a seguir.")
    window.location.replace("https://forms.gle/yDF6WvkzUmD2xWLd6");
});
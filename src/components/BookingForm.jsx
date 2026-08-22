import { useEffect, useMemo, useState } from "react";
import salonData from "../json/salon.json";

const services = [
  "Loc Maintenance",
  "Braids",
  "Hair Treatment",
  "Custom Styling",
];

const businessHours = salonData.businessHours || [];
const slotIntervalMinutes = salonData.booking?.slotInterval || 30;

const timeFromMinutes = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const getOpenSlots = (dayName) => {
  const schedule = businessHours.find((entry) => entry.day === dayName);

  if (!schedule || schedule.closed || !schedule.open || !schedule.close) {
    return [];
  }

  const [openHour, openMinute] = schedule.open.split(":").map(Number);
  const [closeHour, closeMinute] = schedule.close.split(":").map(Number);
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;

  const slots = [];
  for (
    let minuteValue = openMinutes;
    minuteValue < closeMinutes;
    minuteValue += slotIntervalMinutes
  ) {
    slots.push(timeFromMinutes(minuteValue));
  }

  return slots;
};

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCalendarDaysForMonth = (monthDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: totalDays }, (_, index) => {
    const dateNumber = index + 1;
    const date = new Date(year, month, dateNumber);
    date.setHours(0, 0, 0, 0);

    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const schedule = businessHours.find((entry) => entry.day === dayName);
    const isPast = date < today;

    return {
      key: formatDateKey(date),
      date: dateNumber,
      fullDate: date,
      monthLabel: date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      dayName,
      status: isPast ? "past" : schedule?.closed ? "closed" : "available",
    };
  });
};

const BookingForm = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewMonth, setViewMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedService, setSelectedService] = useState(services[0]);
  const [selectedDateKey, setSelectedDateKey] = useState(() => {
    const initialMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const availableDay = getCalendarDaysForMonth(initialMonth).find(
      (day) => day.status === "available",
    );

    return availableDay ? availableDay.key : formatDateKey(today);
  });
  const [selectedTime, setSelectedTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");

  const visibleMonths = useMemo(
    () => [new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)],
    [viewMonth],
  );

  const calendarDays = useMemo(
    () =>
      visibleMonths.flatMap((monthDate) => getCalendarDaysForMonth(monthDate)),
    [visibleMonths],
  );

  const selectedDay = useMemo(
    () => calendarDays.find((day) => day.key === selectedDateKey) || null,
    [calendarDays, selectedDateKey],
  );

  const timeSlots = useMemo(
    () => (selectedDay ? getOpenSlots(selectedDay.dayName) : []),
    [selectedDay],
  );

  useEffect(() => {
    if (!timeSlots.length) {
      setSelectedTime("");
      return;
    }

    if (!timeSlots.includes(selectedTime)) {
      setSelectedTime(timeSlots[0]);
    }
  }, [timeSlots, selectedTime]);

  const selectedStatus = selectedDay?.status || "available";
  const isDateAvailable = selectedStatus === "available";
  const isPastDate = selectedStatus === "past";
  const canSubmit =
    isDateAvailable &&
    customerName.trim().length > 0 &&
    customerPhone.trim().length > 0 &&
    !!selectedTime;

  const goToPreviousMonth = () => {
    setViewMonth(
      (currentMonth) =>
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setViewMonth(
      (currentMonth) =>
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    const dateLabel =
      selectedDay?.fullDate?.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      }) || "selected date";

    alert(
      `Booking confirmed for ${customerName} on ${dateLabel} at ${selectedTime} (${selectedService}).`,
    );
  };

  return (
    <section className="booking-section">
      <div className="booking-card">
        <div className="booking-calendar">
          <div className="calendar-legend">
            <span>
              <span className="legend-dot available"></span> Available
            </span>
            <span>
              <span className="legend-dot booked"></span> Fully booked
            </span>
            <span>
              <span className="legend-dot closed"></span> Closed
            </span>
          </div>

          <div className="calendar-header">
            <button
              type="button"
              className="calendar-nav-button"
              onClick={goToPreviousMonth}
              aria-label="Previous month"
            >
              ←
            </button>

            <div className="calendar-months-grid">
              {visibleMonths.map((monthDate) => (
                <div
                  key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}
                  className="calendar-month-panel"
                >
                  <h4 className="calendar-month-label">
                    {monthDate.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h4>

                  <div className="calendar-grid">
                    {getCalendarDaysForMonth(monthDate).map((day) => (
                      <button
                        key={day.key}
                        type="button"
                        className={`calendar-day ${day.status} ${
                          selectedDateKey === day.key ? "selected" : ""
                        }`}
                        onClick={() => {
                          if (day.status === "available") {
                            setSelectedDateKey(day.key);
                          }
                        }}
                        disabled={day.status !== "available"}
                        aria-label={`${day.dayName} ${day.date}`}
                      >
                        <span>{day.date}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="calendar-nav-button"
              onClick={goToNextMonth}
              aria-label="Next month"
            >
              →
            </button>
          </div>
        </div>

        <form className="booking-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="service">
              Pick a service
            </label>
            <select
              id="service"
              className="form-input"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
            >
              {services.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Selected date</label>
            <div className="selected-summary">
              <strong>
                {selectedDay?.fullDate?.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                }) || "Not selected"}
              </strong>
              <span className={`status-pill ${selectedStatus}`}>
                {selectedStatus === "available" ? "Open" : "Closed"}
              </span>
            </div>
            {!isDateAvailable && (
              <p className="form-note">
                {isPastDate
                  ? "This date has already passed. Please choose a future available date."
                  : selectedDay?.dayName
                    ? `${selectedDay.dayName} is closed based on the salon schedule.`
                    : "Please choose a date marked as available before confirming."}
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="time">
              Pick a time
            </label>
            <select
              id="time"
              className="form-input"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              disabled={!isDateAvailable || timeSlots.length === 0}
            >
              {timeSlots.length ? (
                timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))
              ) : (
                <option value="">Closed</option>
              )}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Your name
            </label>
            <input
              id="name"
              className="form-input"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">
              Phone number
            </label>
            <input
              id="phone"
              className="form-input"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Enter your phone number"
              required
              type="tel"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="notes">
              Notes / requests
            </label>
            <textarea
              id="notes"
              className="form-textarea"
              rows="4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tell us about your preferred style or any special requests"
            />
          </div>

          <div className="booking-summary">
            <h3>Appointment summary</h3>
            <div className="booking-summary-item">
              <span className="summary-label">Service</span>
              <span>{selectedService}</span>
            </div>
            <div className="booking-summary-item">
              <span className="summary-label">Date</span>
              <span>
                {selectedDay?.fullDate?.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                }) || "Not selected"}
              </span>
            </div>
            <div className="booking-summary-item">
              <span className="summary-label">Time</span>
              <span>{selectedTime || "Not selected"}</span>
            </div>
            <div className="booking-summary-item">
              <span className="summary-label">Name</span>
              <span>{customerName || "Not provided"}</span>
            </div>
            <div className="booking-summary-item">
              <span className="summary-label">Phone</span>
              <span>{customerPhone || "Not provided"}</span>
            </div>
            {notes && (
              <div className="booking-summary-item">
                <span className="summary-label">Notes</span>
                <span>{notes}</span>
              </div>
            )}
          </div>

          <button type="submit" className="form-submit" disabled={!canSubmit}>
            Confirm booking
          </button>
        </form>
      </div>
    </section>
  );
};

export default BookingForm;

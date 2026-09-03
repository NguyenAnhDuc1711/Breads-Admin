import { useState, useRef, useEffect, useMemo } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";
import "./DateRangePicker.css";

interface DateRangePickerProps {
  dateFrom?: string;
  dateTo?: string;
  onChange: (from: string, to: string) => void;
  onClear?: () => void;
}

const formatDateToYYYYMMDD = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDisplayDate = (dateStr?: string): string => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return dateStr;
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const mIdx = parseInt(month, 10) - 1;
  return `${parseInt(day, 10)} ${monthNames[mIdx] || month} ${year}`;
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DateRangePicker = ({
  dateFrom,
  dateTo,
  onChange,
  onClear,
}: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialDate = useMemo(() => {
    if (dateFrom) return new Date(dateFrom);
    return new Date();
  }, [dateFrom]);

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  const [tempStart, setTempStart] = useState<string | undefined>(dateFrom);
  const [tempEnd, setTempEnd] = useState<string | undefined>(dateTo);
  const [hoverDate, setHoverDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      setTempStart(dateFrom);
      setTempEnd(dateTo);
      setHoverDate(undefined);
      if (dateFrom) {
        const d = new Date(dateFrom);
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [isOpen, dateFrom, dateTo]);

  const [alignRight, setAlignRight] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const checkPosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const popoverWidth = 420;
        if (rect.left + popoverWidth > window.innerWidth - 16) {
          setAlignRight(true);
        } else {
          setAlignRight(false);
        }
      }
    };

    checkPosition();
    window.addEventListener("resize", checkPosition);
    return () => window.removeEventListener("resize", checkPosition);
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const daysInMonth = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const lastDate = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthLastDate = new Date(viewYear, viewMonth, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthLastDate - i;
      const prevDate = new Date(viewYear, viewMonth - 1, d);
      days.push({
        dateStr: formatDateToYYYYMMDD(prevDate),
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= lastDate; i++) {
      const curDate = new Date(viewYear, viewMonth, i);
      days.push({
        dateStr: formatDateToYYYYMMDD(curDate),
        dayNum: i,
        isCurrentMonth: true,
      });
    }

    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(viewYear, viewMonth + 1, i);
      days.push({
        dateStr: formatDateToYYYYMMDD(nextDate),
        dayNum: i,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const todayStr = useMemo(() => formatDateToYYYYMMDD(new Date()), []);

  const handleDateClick = (dateStr: string) => {
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(dateStr);
      setTempEnd(undefined);
    } else if (tempStart && !tempEnd) {
      if (dateStr < tempStart) {
        setTempStart(dateStr);
        setTempEnd(tempStart);
      } else {
        setTempEnd(dateStr);
      }
    }
  };

  const handleApply = () => {
    if (tempStart && tempEnd) {
      onChange(tempStart, tempEnd);
    } else if (tempStart && !tempEnd) {
      onChange(tempStart, tempStart);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempStart(undefined);
    setTempEnd(undefined);
    if (onClear) onClear();
    else onChange("", "");
    setIsOpen(false);
  };

  const applyPreset = (type: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (type) {
      case "today":
        start = today;
        end = today;
        break;
      case "yesterday": {
        const y = new Date();
        y.setDate(today.getDate() - 1);
        start = y;
        end = y;
        break;
      }
      case "7days":
        start.setDate(today.getDate() - 6);
        end = today;
        break;
      case "30days":
        start.setDate(today.getDate() - 29);
        end = today;
        break;
      case "month":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
      case "all":
        handleClear();
        return;
      default:
        return;
    }

    const startStr = formatDateToYYYYMMDD(start);
    const endStr = formatDateToYYYYMMDD(end);
    setTempStart(startStr);
    setTempEnd(endStr);
    onChange(startStr, endStr);
    setIsOpen(false);
  };

  const triggerLabel = useMemo(() => {
    if (dateFrom && dateTo) {
      if (dateFrom === dateTo) return formatDisplayDate(dateFrom);
      return `${formatDisplayDate(dateFrom)} → ${formatDisplayDate(dateTo)}`;
    }
    if (dateFrom) return `From ${formatDisplayDate(dateFrom)}`;
    if (dateTo) return `Until ${formatDisplayDate(dateTo)}`;
    return "Select date range";
  }, [dateFrom, dateTo]);

  const hasValue = Boolean(dateFrom || dateTo);

  return (
    <div ref={containerRef} className="date-range-picker">
      {/* Trigger Button */}
      <button
        type="button"
        className={`date-range-picker__trigger ${isOpen ? "date-range-picker__trigger--active" : ""} ${hasValue ? "date-range-picker__trigger--has-value" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <FiCalendar size={14} className="date-range-picker__icon" />
        <span>{triggerLabel}</span>
        {hasValue && (
          <span
            role="button"
            className="date-range-picker__clear-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            title="Clear dates"
          >
            <FiX size={12} />
          </span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          className={`date-range-picker__popover ${alignRight ? "date-range-picker__popover--align-right" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sidebar Presets */}
          <div className="date-range-picker__sidebar">
            <button
              type="button"
              className="date-range-picker__preset-btn"
              onClick={() => applyPreset("all")}
            >
              All time
            </button>
            <button
              type="button"
              className="date-range-picker__preset-btn"
              onClick={() => applyPreset("today")}
            >
              Today
            </button>
            <button
              type="button"
              className="date-range-picker__preset-btn"
              onClick={() => applyPreset("yesterday")}
            >
              Yesterday
            </button>
            <button
              type="button"
              className="date-range-picker__preset-btn"
              onClick={() => applyPreset("7days")}
            >
              Last 7 days
            </button>
            <button
              type="button"
              className="date-range-picker__preset-btn"
              onClick={() => applyPreset("30days")}
            >
              Last 30 days
            </button>
            <button
              type="button"
              className="date-range-picker__preset-btn"
              onClick={() => applyPreset("month")}
            >
              This month
            </button>
          </div>

          {/* Calendar View */}
          <div className="date-range-picker__calendar-wrap">
            {/* Header */}
            <div className="date-range-picker__cal-header">
              <span className="date-range-picker__month-title">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <div className="d-flex align-items-center gap-1">
                <button
                  type="button"
                  className="date-range-picker__nav-btn"
                  onClick={prevMonth}
                  title="Previous month"
                >
                  <FiChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  className="date-range-picker__nav-btn"
                  onClick={nextMonth}
                  title="Next month"
                >
                  <FiChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="date-range-picker__grid">
              {WEEKDAYS.map((wd) => (
                <div key={wd} className="date-range-picker__weekday">
                  {wd}
                </div>
              ))}

              {/* Days */}
              {daysInMonth.map((day) => {
                const isToday = day.dateStr === todayStr;
                const isStart = day.dateStr === tempStart;
                const isEnd = day.dateStr === tempEnd;
                const isSingle = isStart && !tempEnd;

                let inRange = false;
                if (tempStart && tempEnd) {
                  inRange = day.dateStr > tempStart && day.dateStr < tempEnd;
                } else if (tempStart && hoverDate && !tempEnd) {
                  const rangeStart = tempStart < hoverDate ? tempStart : hoverDate;
                  const rangeEnd = tempStart < hoverDate ? hoverDate : tempStart;
                  inRange = day.dateStr > rangeStart && day.dateStr < rangeEnd;
                }

                let classNames = "date-range-picker__day-btn";
                if (!day.isCurrentMonth) classNames += " date-range-picker__day-btn--dimmed";
                if (isToday) classNames += " date-range-picker__day-btn--today";
                if (isStart && isEnd) classNames += " date-range-picker__day-btn--range-single";
                else if (isStart) classNames += " date-range-picker__day-btn--range-start";
                else if (isEnd) classNames += " date-range-picker__day-btn--range-end";
                else if (isSingle) classNames += " date-range-picker__day-btn--range-single";
                else if (inRange) classNames += " date-range-picker__day-btn--in-range";

                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    className={classNames}
                    onClick={() => handleDateClick(day.dateStr)}
                    onMouseEnter={() => {
                      if (tempStart && !tempEnd) setHoverDate(day.dateStr);
                    }}
                  >
                    {day.dayNum}
                  </button>
                );
              })}
            </div>

            {/* Footer Actions */}
            <div className="date-range-picker__footer">
              <span className="date-range-picker__hint">
                {tempStart && tempEnd
                  ? `${formatDisplayDate(tempStart)} - ${formatDisplayDate(tempEnd)}`
                  : tempStart
                    ? "Select end date"
                    : "Select start date"}
              </span>
              <div className="date-range-picker__actions">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm px-2 py-0"
                  style={{ height: "26px", fontSize: "0.75rem" }}
                  onClick={handleClear}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm px-2 py-0"
                  style={{ height: "26px", fontSize: "0.75rem" }}
                  disabled={!tempStart}
                  onClick={handleApply}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;

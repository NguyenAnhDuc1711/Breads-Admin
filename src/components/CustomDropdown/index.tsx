import { useState, useRef, useEffect } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";

// --- Custom Reusable Dropdown for Filters ---
export interface DropdownOption<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  dotColor?: string;
}

interface CustomDropdownProps<T> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  icon?: React.ReactNode;
  placeholder?: string;
  size?: "sm" | "md";
  minWidth?: string;
}

function CustomDropdown<T extends string | number>({
  value,
  options,
  onChange,
  icon,
  placeholder,
  size = "md",
  minWidth = "130px",
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const hasValue = value !== "" && value !== undefined;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
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

  return (
    <div
      ref={dropdownRef}
      className="custom-dropdown"
      style={{ minWidth }}
    >
      <button
        type="button"
        className={`custom-dropdown__trigger ${isOpen ? "custom-dropdown__trigger--active" : ""} ${hasValue ? "custom-dropdown__trigger--has-value" : ""} ${size === "sm" ? "custom-dropdown__trigger--sm" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        {selectedOption?.dotColor ? (
          <span
            className="users-page__status-dot-inline"
            style={{ backgroundColor: selectedOption.dotColor }}
          />
        ) : selectedOption?.icon ? (
          selectedOption.icon
        ) : (
          icon
        )}
        <span>{selectedOption?.label || placeholder || "Select"}</span>
        <FiChevronDown
          size={12}
          className={`custom-dropdown__chevron ${isOpen ? "custom-dropdown__chevron--open" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="custom-dropdown__menu" style={{ minWidth }}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                className={`custom-dropdown__option ${isSelected ? "custom-dropdown__option--selected" : ""}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  {opt.dotColor ? (
                    <span
                      className="users-page__status-dot-inline"
                      style={{ backgroundColor: opt.dotColor }}
                    />
                  ) : (
                    opt.icon
                  )}
                  <span>{opt.label}</span>
                </div>
                {isSelected && <FiCheck size={13} className="text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CustomDropdown;

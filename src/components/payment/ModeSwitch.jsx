import { useRef } from "react";
import PropTypes from "prop-types";
import { Heart, Repeat } from "lucide-react";

/**
 * Segmented control for donation frequency.
 *
 * Paper-and-ink: a warm track, a paper pill that slides, ink text. The only
 * colour is the blue accent on the active icon.
 */

const OPTIONS = [
    { id: "once", label: "One-time", Icon: Heart },
    { id: "monthly", label: "Monthly", Icon: Repeat },
];

export default function ModeSwitch({ value, onChange }) {
    const index = Math.max(
        0,
        OPTIONS.findIndex((option) => option.id === value),
    );
    const buttons = useRef([]);

    const move = (next) => {
        const bounded = (next + OPTIONS.length) % OPTIONS.length;
        onChange(OPTIONS[bounded].id);
        buttons.current[bounded]?.focus();
    };

    const onKeyDown = (event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            event.preventDefault();
            move(index + 1);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            event.preventDefault();
            move(index - 1);
        } else if (event.key === "Home") {
            event.preventDefault();
            move(0);
        } else if (event.key === "End") {
            event.preventDefault();
            move(OPTIONS.length - 1);
        }
    };

    return (
        <div
            role="tablist"
            aria-label="Donation frequency"
            className="rounded-xl border border-[rgba(31,27,22,0.09)] bg-[#efe9df] p-1"
        >
            <div className="relative grid grid-cols-2">
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-0 w-1/2 rounded-[8px] bg-[#fdfbf7] shadow-sm ring-1 ring-[rgba(31,27,22,0.06)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ transform: `translateX(${index * 100}%)` }}
                />
                {OPTIONS.map(({ id, label, Icon }) => {
                    const active = id === value;

                    return (
                        <button
                            key={id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            tabIndex={active ? 0 : -1}
                            ref={(el) => {
                                buttons.current[OPTIONS.findIndex((o) => o.id === id)] = el;
                            }}
                            onKeyDown={onKeyDown}
                            onClick={() => onChange(id)}
                            className={`relative z-10 flex items-center justify-center gap-2 rounded-[8px] py-2.5 text-sm transition-colors duration-200 ${
                                active
                                    ? "font-medium text-[#1f1b16]"
                                    : "font-normal text-[#6b6257] hover:text-[#5e554a]"
                            }`}
                        >
                            <Icon
                                size={16}
                                strokeWidth={1.5}
                                className={
                                    active ? "text-[#0f5fa5]" : "text-[#6b6257]"
                                }
                            />
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

ModeSwitch.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};
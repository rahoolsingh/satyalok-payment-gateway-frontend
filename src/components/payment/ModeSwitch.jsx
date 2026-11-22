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
                            onClick={() => onChange(id)}
                            className={`relative z-10 flex items-center justify-center gap-2 rounded-[8px] py-2.5 text-sm transition-colors duration-200 ${
                                active
                                    ? "font-medium text-[#1f1b16]"
                                    : "font-normal text-[#8a847a] hover:text-[#5e554a]"
                            }`}
                        >
                            <Icon
                                size={16}
                                strokeWidth={1.5}
                                className={
                                    active ? "text-[#0f5fa5]" : "text-[#8a847a]"
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
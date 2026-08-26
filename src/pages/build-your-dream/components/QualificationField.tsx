import type { QualificationQuestion } from "@/lib/content/build-your-dream/types";
import styles from "./QualificationField.module.scss";

type QualificationFieldProps = {
  question: QualificationQuestion;
  disabled?: boolean;
};

export default function QualificationField({
  question,
  disabled = false,
}: QualificationFieldProps) {
  switch (question.type) {
    case "text":
      return (
        <div className={styles.field}>
          <label htmlFor={`qual-${question.id}`}>
            {question.question}
            {question.required ? " *" : ""}
          </label>
          <input
            id={`qual-${question.id}`}
            name={question.id}
            type="text"
            required={question.required}
            placeholder={question.placeholder}
            disabled={disabled}
            suppressHydrationWarning
          />
        </div>
      );
    default:
      return null;
  }
}

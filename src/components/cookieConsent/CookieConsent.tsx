import { useEffect, useState } from "react";
import "./CookieConsent.scss";

const STORAGE_KEY = "weblio-cookie-consent";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY) === "accepted";
    if (!accepted) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="cookie-consent"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      dir="rtl"
    >
      <div className="cookie-consent__panel">
        <div className="cookie-consent__content">
          <h2 className="cookie-consent__title" id="cookie-consent-title">
            שימוש בעוגיות
          </h2>
          <p className="cookie-consent__text">
            אנחנו משתמשים בעוגיות כדי לשפר את חוויית הגלישה באתר ולנתח תנועה.
            המשך שימוש באתר מהווה הסכמה לשימוש בעוגיות.
          </p>
        </div>
        <button
          type="button"
          className="cookie-consent__btn"
          onClick={handleAccept}
        >
          הבנתי
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;

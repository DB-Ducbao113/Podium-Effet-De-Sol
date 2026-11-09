import { useEffect } from 'react';
import App from './App';
import './scoped.css';
import './ux1.css';

export default function InsideMachineTrialPage() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Inside the Machine | Podium EDS';
    return () => {
      document.title = previousTitle;
      delete window.__ITM_R44__;
    };
  }, []);

  return <div className="itm-i1"><App /></div>;
}

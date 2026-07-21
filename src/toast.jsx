/* ============================================================
   toast.jsx — Global toast system
   Use via window.toast("mensagem", "info"|"success"|"warning"|"danger")
   ============================================================ */

const _ToastCtx = { listeners: [], counter: 0 };

window.toast = function(message, variant = "info", opts = {}) {
  const id = ++_ToastCtx.counter;
  const duration = opts.duration ?? 3200;
  const payload = { id, message, variant, duration, description: opts.description, action: opts.action };
  _ToastCtx.listeners.forEach(fn => fn({ type: "add", payload }));
  if (duration !== Infinity) {
    setTimeout(() => {
      _ToastCtx.listeners.forEach(fn => fn({ type: "remove", id }));
    }, duration);
  }
  return id;
};

window.toastDemo = function(label) {
  window.toast(`Ação "${label}" não disponível neste protótipo`, "info");
};

function ToastViewport() {
  const [toasts, setToasts] = React.useState([]);
  React.useEffect(() => {
    const fn = (ev) => {
      if (ev.type === "add") setToasts(t => [...t, ev.payload]);
      else if (ev.type === "remove") setToasts(t => t.filter(x => x.id !== ev.id));
    };
    _ToastCtx.listeners.push(fn);
    return () => { _ToastCtx.listeners = _ToastCtx.listeners.filter(f => f !== fn); };
  }, []);

  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      {toasts.map(t => (
        <div key={t.id} className={"toast toast--" + t.variant} role="status">
          <span className="toast__icon">
            {t.variant === "success" ? <Icon.check size={14}/> :
             t.variant === "warning" ? <Icon.warning size={14}/> :
             t.variant === "danger"  ? <Icon.warning size={14}/> :
             <Icon.info size={14}/>}
          </span>
          <span className="toast__body">
            <span className="toast__msg">{t.message}</span>
            {t.description ? <span className="toast__desc">{t.description}</span> : null}
          </span>
          {t.action ? (
            <button className="toast__action" onClick={() => {
              t.action.onClick();
              setToasts(ts => ts.filter(x => x.id !== t.id));
            }}>{t.action.label}</button>
          ) : null}
          <button className="toast__close"
            aria-label="Fechar notificação"
            onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))}>
            <Icon.x size={12}/>
          </button>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { ToastViewport });

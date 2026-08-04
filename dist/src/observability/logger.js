const priorities = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};
export function createJsonLogger(minimumLevel) {
  function write(level, message, fields = {}) {
    if (priorities[level] < priorities[minimumLevel]) return;
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...fields,
    });
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  }
  return {
    debug: (message, fields) => write("debug", message, fields),
    info: (message, fields) => write("info", message, fields),
    warn: (message, fields) => write("warn", message, fields),
    error: (message, fields) => write("error", message, fields),
  };
}

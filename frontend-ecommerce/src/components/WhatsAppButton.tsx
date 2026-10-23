export const WhatsAppButton = () => {
  return (
    <button
      type="button"
      aria-label="WhatsApp"
      className="whatsapp-button group fixed z-40 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-[#25d366] text-white shadow-[0_6px_24px_rgba(0,0,0,0.2)] transition-colors hover:bg-[#20bd5a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#128c4a]"
    >
      <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" className="h-8 w-8">
        <path d="M16 .8A15.1 15.1 0 0 0 3 23.6L.8 31.2l7.8-2A15.1 15.1 0 1 0 16 .8Zm0 27.6a12.4 12.4 0 0 1-6.3-1.7l-.5-.3-4.6 1.2 1.2-4.5-.3-.5A12.5 12.5 0 1 1 16 28.4Zm6.9-9.3c-.4-.2-2.2-1.1-2.5-1.2-.4-.1-.6-.2-.9.2-.2.4-.9 1.2-1.1 1.4-.2.2-.4.3-.8.1-.4-.2-1.6-.6-3-1.8-1.1-1-1.8-2.2-2-2.6-.2-.4 0-.6.2-.8l.6-.7.4-.6c.1-.2 0-.5 0-.7l-1.2-2.8c-.3-.7-.6-.6-.9-.6H11c-.3 0-.7.1-1 .5s-1.3 1.3-1.3 3.1 1.4 3.5 1.6 3.7c.2.3 2.7 4.1 6.5 5.7.9.4 1.6.6 2.2.8.9.3 1.7.2 2.3.1.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.6.2-1.8-.1-.2-.3-.3-.7-.5Z" />
      </svg>
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-[#202022] px-3 py-2 text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:block">Hablemos por WhatsApp</span>
    </button>
  );
};

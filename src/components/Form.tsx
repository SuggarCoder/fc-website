import { Component, For, Show, createSignal, createMemo, onCleanup, onMount } from 'solid-js';

const countries = [
  { code: 'CN', name: 'China', native: '中国', dial_code: '+86' },
  { code: 'HK', name: 'Hong Kong', native: '香港', dial_code: '+852' },
  { code: 'TW', name: 'Taiwan', native: '台灣', dial_code: '+886' },
  { code: 'JP', name: 'Japan', native: '日本', dial_code: '+81' },
  { code: 'KR', name: 'South Korea', native: '대한민국', dial_code: '+82' },
  { code: 'US', name: 'United States', native: '', dial_code: '+1' },
  { code: 'GB', name: 'United Kingdom', native: '', dial_code: '+44' },
  { code: 'DE', name: 'Germany', native: 'Deutschland', dial_code: '+49' },
  { code: 'FR', name: 'France', native: '', dial_code: '+33' },
  { code: 'AU', name: 'Australia', native: '', dial_code: '+61' },
  { code: 'SG', name: 'Singapore', native: '新加坡', dial_code: '+65' },
  { code: 'MY', name: 'Malaysia', native: '', dial_code: '+60' },
  { code: 'TH', name: 'Thailand', native: 'ประเทศไทย', dial_code: '+66' },
  { code: 'VN', name: 'Vietnam', native: 'Việt Nam', dial_code: '+84' },
  { code: 'PH', name: 'Philippines', native: 'Pilipinas', dial_code: '+63' },
  { code: 'IN', name: 'India', native: 'भारत', dial_code: '+91' },
  { code: 'ID', name: 'Indonesia', native: '', dial_code: '+62' },
  { code: 'AE', name: 'UAE', native: 'الإمارات', dial_code: '+971' },
  { code: 'SA', name: 'Saudi Arabia', native: 'السعودية', dial_code: '+966' },
  { code: 'CA', name: 'Canada', native: '', dial_code: '+1' },
  { code: 'BR', name: 'Brazil', native: 'Brasil', dial_code: '+55' },
  { code: 'MX', name: 'Mexico', native: 'México', dial_code: '+52' },
  { code: 'RU', name: 'Russia', native: 'Россия', dial_code: '+7' },
  { code: 'IT', name: 'Italy', native: 'Italia', dial_code: '+39' },
  { code: 'ES', name: 'Spain', native: 'España', dial_code: '+34' },
  { code: 'NL', name: 'Netherlands', native: 'Nederland', dial_code: '+31' },
  { code: 'NZ', name: 'New Zealand', native: '', dial_code: '+64' },
];

const Form: Component = () => {
  const [selected, setSelected] = createSignal({ code: 'JP', dial: '+81' });
  const [showList, setShowList] = createSignal(false);
  const [search, setSearch] = createSignal('');
  let dropdownRef: HTMLDivElement | undefined;

  // 点击外部关闭下拉
  const handleClickOutside = (e: MouseEvent) => {
    if (dropdownRef && !dropdownRef.contains(e.target as Node)) {
      setShowList(false);
      setSearch('');
    }
  };

  onMount(() => document.addEventListener('mousedown', handleClickOutside));
  onCleanup(() => document.removeEventListener('mousedown', handleClickOutside));

  // 下拉打开时拦截 wheel 事件，阻止 Lenis 滚动
  let menuRef: HTMLDivElement | undefined;
  const handleWheel = (e: WheelEvent) => {
    if (!menuRef) return;
    const scrollEl = menuRef.querySelector('.phone-scroll') as HTMLElement;
    if (!scrollEl) { e.preventDefault(); e.stopPropagation(); return; }
    const { scrollTop, scrollHeight, clientHeight } = scrollEl;
    const atTop = scrollTop <= 0 && e.deltaY < 0;
    const atBottom = scrollTop + clientHeight >= scrollHeight && e.deltaY > 0;
    
    if (atTop || atBottom) e.preventDefault();
    e.stopPropagation();
  };

  const filtered = createMemo(() => {
    const q = search().toLowerCase();
    if (!q) return countries;
    return countries.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.native.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.dial_code.includes(q)
    );
  });

  return (
    // 修改 1: gap-y-12 -> gap-y-5 (大幅减少移动端垂直间距)
    <section class="grid grid-cols-1 md:grid-cols-2 gap-x-6 md:gap-x-10 gap-y-5 md:gap-y-12 w-full">

      {/* 修改 2: 使用 grid-cols-2 和 md:contents 技巧 */}
      {/* 作用: 移动端 First/Last Name 并排显示，节省一行高度。桌面端保持原样。 */}
      <div class="grid grid-cols-2 gap-4 md:contents">
        <FloatingInput label="First Name" required />
        <FloatingInput label="Last Name" required />
      </div>

      {/* Phone Number Item */}
      <div class="relative border-b border-gray-200 focus-within:border-[#1a2b4b] pb-1 transition-colors">
        <label class="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">
          Phone Number <span class="text-[#ff6b4a]">*</span>
        </label>
        <div class="flex items-center gap-2 md:gap-3">
          {/* Trigger */}
          <div ref={dropdownRef} class="relative cursor-pointer select-none w-12 md:w-14 shrink-0"
               onClick={() => { setShowList(!showList()); setSearch(''); }}>
            <div class="flex items-center gap-1 text-[16px] md:text-[20px] font-medium text-[#1a2b4b]">
              <span class="w-6 md:w-7 inline-block">{selected().code}</span>
              <div class={`i-carbon-chevron-down text-[10px] mt-0.5 transition-transform duration-200 ${showList() ? 'rotate-180' : ''}`} />
            </div>

            {/* Searchable Dropdown Menu */}
            <Show when={showList()}>
              <div ref={menuRef} onWheel={handleWheel}
                   class="absolute top-[calc(100%+8px)] left-0 z-50 w-[80vw] sm:w-72 md:w-80 bg-white rounded-lg overflow-hidden"
                   style="box-shadow: 0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08);">
                {/* Search Bar */}
                <div class="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    placeholder="Search"
                    value={search()}
                    onInput={(e) => setSearch(e.currentTarget.value)}
                    class="w-full bg-transparent outline-none border-none appearance-none p-0 m-0 text-[14px] text-[#1a2b4b] placeholder-gray-300 font-light"
                    autofocus
                  />
                </div>
                <div class="h-px bg-gray-100 mx-4" />
                <style>{`
                  .phone-scroll::-webkit-scrollbar { width: 1px; }
                  .phone-scroll::-webkit-scrollbar-track { background: transparent; }
                  .phone-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); }
                  .phone-scroll { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.15) transparent; }
                `}</style>
                <div class="max-h-48 md:max-h-64 overflow-y-auto py-1 phone-scroll">
                  <For each={filtered()}>
                    {(item) => (
                      <div
                        class="flex items-center px-4 py-2.5 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected({ code: item.code, dial: item.dial_code });
                          setShowList(false);
                          setSearch('');
                        }}
                      >
                        <span class="text-[13px] text-gray-400 uppercase w-8 shrink-0 font-medium">{item.code}</span>
                        <span class="text-[14px] text-[#1a2b4b] font-normal truncate">
                          {item.name}
                        </span>
                        <span class="text-[13px] text-[#8ba3c7] ml-auto pl-3 shrink-0">{item.dial_code}</span>
                      </div>
                    )}
                  </For>
                  <Show when={filtered().length === 0}>
                    <div class="px-4 py-6 text-center text-[13px] text-gray-300">No results</div>
                  </Show>
                </div>
              </div>
            </Show>
          </div>
          <span class="text-[16px] md:text-[20px] text-gray-300 font-light w-10 md:w-12 shrink-0">{selected().dial}</span>
          <input type="tel" class="w-full bg-transparent outline-none border-none appearance-none p-0 m-0 text-[16px] md:text-[20px] font-light" />
        </div>
      </div>

      <FloatingInput label="E-mail" type="email" required />
      
      <div class="md:col-span-2">
        <FloatingInput label="Company Name" required />
      </div>

      {/* Bottom Action: 修改布局 */}
      <div class="md:col-span-2 flex flex-col md:flex-row justify-between items-center md:items-end mt-2 md:mt-4 gap-4 md:gap-8">
          {/* 移动端: 隐私协议放在按钮下方，且字号变小 */}
          <div class="order-2 md:order-1 text-center md:text-left">
            <p class="text-[10px] text-gray-400 leading-tight">
                By clicking Submit you agree to our <br class="hidden md:block"/>
                <strong class="text-gray-500 underline decoration-gray-300">Privacy Policy</strong> terms
            </p>
          </div>
          
          {/* 移动端: 按钮高度 py-3 (原 py-4)，更紧凑 */}
          <button class="order-1 md:order-2 relative bg-orange-500 text-white text-left w-full md:w-60 py-3 md:py-4 px-6 rounded-md group transition-all border-none appearance-none cursor-pointer outline-none shadow-lg shadow-orange-500/20">
              <span class="text-sm font-bold tracking-wide">Submit</span>
              <div class="i-mdi-light-chevron-right text-xl absolute right-4 bottom-[0.8rem] md:bottom-1 group-hover:translate-x-1 transition-transform" />
          </button>
      </div>
      
    </section>
  );
};

// 浮动标签子组件 (优化版)
const FloatingInput: Component<{ label: string; required?: boolean; type?: string }> = (props) => (
  // pb-1 减少底部内边距
  <div class="relative border-b border-gray-200 focus-within:border-[#1a2b4b] transition-colors pb-1 w-full">
    <input
      type={props.type || 'text'}
      placeholder=" "
      // 移动端字号调整: text-[16px] 避免 iOS 自动缩放，且更紧凑
      class="peer w-full bg-transparent outline-none border-none appearance-none p-0 m-0 text-[16px] md:text-[20px] font-light leading-normal"
    />
    <label class="absolute left-0 top-0 text-[16px] md:text-[20px] text-gray-400 transition-all duration-200 pointer-events-none truncate max-w-full
                  peer-focus:-top-4 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-widest
                  peer-[:not(:placeholder-shown)]:-top-4 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:uppercase">
      {props.label} {props.required && <span class="text-[#ff6b4a]">*</span>}
    </label>
    
    {/* 修改 3: 移除 mt-4，改为 mt-1。原先的 mt-4 浪费了每个输入框约 16px 的高度 */}
    <div class="w-full h-px border-0 mt-1"/>
  </div>
);

export default Form;
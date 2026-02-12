import { createSignal, onMount, For, Show } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import type { SiteData, MenuSection } from '../config/siteData';
import { defaultSiteData } from '../config/siteData';

interface Props {
  token: string;
  onLogout: () => void;
}

const AdminPanel = (props: Props) => {
  const [data, setData] = createStore<SiteData>(structuredClone(defaultSiteData));
  const [saving, setSaving] = createSignal(false);
  const [msg, setMsg] = createSignal<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    try {
      const res = await fetch('/api/admin/data');
      const json = await res.json();
      if (json.data) {
        setData(json.data);
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  });

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/data', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${props.token}`,
        },
        body: JSON.stringify(data),
      });

      if (res.status === 401) {
        setMsg({ type: 'err', text: 'Session expired, please login again' });
        props.onLogout();
        return;
      }

      const json = await res.json();
      if (!res.ok) {
        setMsg({ type: 'err', text: json.error || 'Save failed' });
        return;
      }
      setMsg({ type: 'ok', text: 'Saved successfully!' });
      setTimeout(() => setMsg(null), 3000);
    } catch {
      setMsg({ type: 'err', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  // --- Styles ---
  const card = 'bg-[#1a1e3a] rounded-lg p-6 flex flex-col gap-4';
  const label = 'text-white/50 text-xs uppercase tracking-wider';
  const input = 'w-full bg-transparent border-0 border-b border-b-solid border-b-white/15 px-0 py-2 text-white text-sm outline-none focus:border-b-orange-500 transition-colors placeholder:text-white/20';
  const textarea = 'w-full bg-transparent border border-solid border-white/15 rounded-md px-3 py-2 text-white text-sm outline-none focus:border-orange-500 transition-colors resize-y min-h-24 placeholder:text-white/20';
  const sectionTitle = 'text-lg font-light text-white/80 mb-2';
  const addBtn = 'text-xs text-orange-400 hover:text-orange-300 cursor-pointer bg-transparent border border-solid border-orange-400/30 hover:border-orange-400/60 rounded px-3 py-1 transition-colors';
  const removeBtn = 'text-xs text-red-400 hover:text-red-300 cursor-pointer bg-transparent border-0 transition-colors';

  return (
    <div class="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div class="flex items-center justify-between mb-10">
        <div>
          <h1 class="text-2xl font-light tracking-wide">Site Management</h1>
          <p class="text-white/30 text-xs mt-1">FLOAT CAPITAL Admin</p>
        </div>
        <button
          onClick={props.onLogout}
          class="text-white/40 hover:text-white text-xs bg-transparent border border-solid border-white/15 hover:border-white/30 rounded px-4 py-2 cursor-pointer transition-colors"
        >
          Logout
        </button>
      </div>

      <Show when={!loading()} fallback={<div class="text-white/40 text-center py-20">Loading...</div>}>
        <div class="flex flex-col gap-8">

          {/* 1. Contact Email */}
          <div class={card}>
            <h2 class={sectionTitle}>Contact Email</h2>
            <div>
              <span class={label}>Email Address</span>
              <input
                class={input}
                value={data.contactEmail}
                onInput={(e) => setData('contactEmail', e.currentTarget.value)}
                placeholder="infor@floatcapital.com"
              />
            </div>
          </div>

          {/* 2. Section 2 */}
          <div class={card}>
            <h2 class={sectionTitle}>Section 2 — Hero Sub</h2>
            <div>
              <span class={label}>Title</span>
              <input
                class={input}
                value={data.sec2Title}
                onInput={(e) => setData('sec2Title', e.currentTarget.value)}
              />
            </div>
            <div>
              <span class={label}>Description</span>
              <textarea
                class={textarea}
                value={data.sec2Desc}
                onInput={(e) => setData('sec2Desc', e.currentTarget.value)}
              />
            </div>
          </div>

          {/* 3. Desc Text */}
          <div class={card}>
            <h2 class={sectionTitle}>Introduction Description</h2>
            <div>
              <span class={label}>Text</span>
              <textarea
                class={textarea}
                value={data.descText}
                onInput={(e) => setData('descText', e.currentTarget.value)}
              />
            </div>
          </div>

          {/* 4. Section 4 */}
          <div class={card}>
            <h2 class={sectionTitle}>Section 4 — Services</h2>
            <For each={data.sec4Data}>
              {(item, i) => (
                <div class="border border-solid border-white/8 rounded-md p-4 flex flex-col gap-3">
                  <div class="flex items-center justify-between">
                    <span class="text-white/30 text-xs">#{i() + 1}</span>
                  </div>
                  <div>
                    <span class={label}>Title</span>
                    <input
                      class={input}
                      value={item.title}
                      onInput={(e) => setData('sec4Data', i(), 'title', e.currentTarget.value)}
                    />
                  </div>
                  <div>
                    <span class={label}>Description</span>
                    <textarea
                      class={textarea}
                      value={item.desc}
                      onInput={(e) => setData('sec4Data', i(), 'desc', e.currentTarget.value)}
                    />
                  </div>
                </div>
              )}
            </For>
          </div>

          {/* 5. Section 6 */}
          <div class={card}>
            <h2 class={sectionTitle}>Section 6 — Capital Flow</h2>
            <For each={data.sec6Data}>
              {(item, i) => (
                <div class="border border-solid border-white/8 rounded-md p-4 flex flex-col gap-3">
                  <div class="flex items-center justify-between">
                    <span class="text-white/30 text-xs">#{i() + 1}</span>
                  </div>
                  <div>
                    <span class={label}>Title</span>
                    <input
                      class={input}
                      value={item.title}
                      onInput={(e) => setData('sec6Data', i(), 'title', e.currentTarget.value)}
                    />
                  </div>
                  <div>
                    <span class={label}>Description</span>
                    <textarea
                      class={textarea}
                      value={item.desc}
                      onInput={(e) => setData('sec6Data', i(), 'desc', e.currentTarget.value)}
                    />
                  </div>
                </div>
              )}
            </For>
          </div>

          {/* 6. Menu Data */}
          <div class={card}>
            <h2 class={sectionTitle}>Menu Data</h2>
            <For each={data.menuData}>
              {(section, si) => (
                <div class="border border-solid border-white/8 rounded-md p-4 flex flex-col gap-4">
                  <div>
                    <span class={label}>Menu Label</span>
                    <input
                      class={input}
                      value={section.label}
                      onInput={(e) => setData('menuData', si(), 'label', e.currentTarget.value)}
                    />
                  </div>
                  <div class="flex flex-col gap-3">
                    <span class={label}>Items</span>
                    <For each={section.items}>
                      {(item, ii) => (
                        <div class="flex flex-col gap-2 pl-4 border-l-2 border-l-solid border-l-white/10">
                          <input
                            class={input}
                            value={item.title}
                            onInput={(e) => setData('menuData', si(), 'items', ii(), 'title', e.currentTarget.value)}
                            placeholder="Title"
                          />
                          <input
                            class={input}
                            value={item.desc || ''}
                            onInput={(e) => setData('menuData', si(), 'items', ii(), 'desc', e.currentTarget.value)}
                            placeholder="Description (optional)"
                          />
                          <button
                            class={removeBtn}
                            onClick={() => setData(produce((d) => { d.menuData[si()].items.splice(ii(), 1); }))}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </For>
                    <button
                      class={addBtn}
                      onClick={() => setData(produce((d) => { d.menuData[si()].items.push({ title: '', desc: '' }); }))}
                    >
                      + Add Item
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>

          {/* Save Button */}
          <div class="sticky bottom-4 flex flex-col items-center gap-2 z-10">
            <Show when={msg()}>
              {(m) => (
                <div class={`text-sm px-4 py-2 rounded ${m().type === 'ok' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                  {m().text}
                </div>
              )}
            </Show>
            <button
              onClick={save}
              disabled={saving()}
              class="w-full max-w-md bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-4 rounded-lg text-base font-medium transition-colors border-0 cursor-pointer shadow-lg shadow-orange-500/20"
            >
              {saving() ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default AdminPanel;

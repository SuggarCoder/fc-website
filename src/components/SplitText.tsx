import { type Component, For } from 'solid-js';

/**
 * Renders each character of `text` as an individual <span>.
 * Ref callbacks push directly to the parent's `chars` array during render,
 * guaranteeing they are available before any onMount fires.
 */
const SplitText: Component<{
  text: string;
  class?: string;
  chars: HTMLSpanElement[];
}> = (props) => {
  return (
    <span class={props.class}>
      <For each={[...props.text]}>
        {(ch) => (
          <span
            ref={(el) => props.chars.push(el)}
            style={{ display: 'inline-block' }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        )}
      </For>
    </span>
  );
};

export default SplitText;


const element = document.querySelector('#inputbox1');
const label = document.querySelector('#dialog-label');
const input = document.querySelector('#dialog-input');
const cancel = document.querySelector('#dialog-cancel');
const ok = document.querySelector('#dialog-ok');

let screen = undefined;

export const inputbox = {
    setScreen(scr) {
        screen = scr;
    },
    /** Prompt the user for input, similar to window.prompt(). Displays a label, text input, Ok and Cancel buttons
     * @param {string} prompt - A label/prompt for the input
     * @param {string} [value=""] - The default value of the input
     * @param {boolean} [allowInput=true] - Show the input textbox (use inputbox.confirm() instead of this)
     * @param {boolean} [allowCancel=true] - Show the Cancel button (use inputbox.alert() instead of this)
     * @returns {Promise<string>} (`true` if allowInput=false) and `false` if the user selects Cancel
     */
    prompt(prompt, value = '', allowInput = true, allowCancel = true) {
        element.classList.add('open');
        label.innerHTML = prompt;
        input.value = value;

        input.style.display = allowInput ? '' : 'none';
        cancel.style.display = allowCancel ? '' : 'none';

        input.focus();

        if (screen) screen.keyboard.forceClearPressedKeys();

        return new Promise((res, rej) => {
            const ok_click = () => {
                res(allowInput ? input.value || '' : true);
                this.close();
                remove_events();
            }
            const cancel_click = () => {
                res(false);
                this.close();
                remove_events();
            }
            const window_keydown = (evt) => {
                if (evt.key === 'Escape') {
                    cancel.click();
                } else if (evt.key === 'Enter' && input.value) {
                    ok.click();
                }
            }
            const remove_events = () => {
                ok.removeEventListener('click', ok_click);
                cancel.removeEventListener('click', cancel_click);
                window.removeEventListener('keydown', window_keydown)
            }
            ok.addEventListener('click', ok_click);
            cancel.addEventListener('click', cancel_click);
            window.addEventListener('keydown', window_keydown)
        });
    },
    /** Prompt the user for confirmation, similar to window.confirm(). Displays a label, Ok and Cancel buttons.
     * @param {string} prompt - The prompt/confirmation text
     * @param {boolean} [allowCancel=true] - Show the Cancel button (use inputbox.alert() instead of this)
     * @returns {Promise<boolean>} `true` if Ok is clicked, `false` if Cancel is clicked.
     */
    async confirm(prompt, allowCancel = true) {
        return this.prompt(prompt, undefined, false, allowCancel);
    },
    /** Alert the user, similar to window.alert(). Displays a label and Ok button.
     * @param {string} prompt - The alert text
     * @returns {Promise<boolean>} `true` when the user clicks Ok
     */
    async alert(prompt) {
        return this.prompt(prompt, undefined, false, false);
    },
    async close() {
        this.reset();
        if (screen) screen.element.focus();
        element.classList.remove('open');
    },
    async reset() {
        ok.style.display = '';
        cancel.style.display = '';
        input.style.display = '';
        input.value = '';
    }
}
"use strict";

let toastHideTimer;
let toastCloseTimer;

function showToast(title, message, type = "normal", duration = 3000) {
    const toast = document.getElementById("toast-component");
    const toastTitle = document.getElementById("toast-title");
    const toastMessage = document.getElementById("toast-message");

    if (!toast || !toastTitle || !toastMessage) return;

    const allowedTypes = new Set(["success", "error", "normal"]);
    const selectedType = allowedTypes.has(type) ? type : "normal";

    clearTimeout(toastHideTimer);
    clearTimeout(toastCloseTimer);

    toast.classList.remove("toast-success", "toast-error", "toast-normal");
    toast.classList.add(`toast-${selectedType}`);
    toastTitle.textContent = String(title ?? "");
    toastMessage.textContent = String(message ?? "");

    if (!toast.matches(":popover-open")) {
        toast.showPopover();
        void toast.offsetHeight;
    }

    toast.classList.remove("toast-hidden");
    toast.classList.add("toast-show");

    toastHideTimer = setTimeout(() => {
        toast.classList.remove("toast-show");
        toast.classList.add("toast-hidden");

        toastCloseTimer = setTimeout(() => {
            if (toast.matches(":popover-open")) toast.hidePopover();
        }, 300);
    }, duration);
}

window.showToast = showToast;

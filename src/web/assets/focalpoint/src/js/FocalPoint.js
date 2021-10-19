"use strict";
class FocalPoint {
    constructor($target, $button, movable) {
        this.visible = false;
        this.dragging = false;
        this.saving = false;
        this.shouldSave = false;
        this.lastX = 0;
        this.lastY = 0;
        this.debounceTimeout = 1500;
        this.focalId = 'focal-point-' + Math.floor(Math.random() * 99999);
        this.$target = $target;
        this.$focal = $('<div class="preview-focal-point" id="' + this.focalId + '"><div class="inner"></div></div>').hide().appendTo(this.$target);
        const initialPosition = this.$target.find('img').data('focal');
        this.focalPos = initialPosition.split(';');
        this.assetUid = this.$target.find('img').data('uid');
        if (this.isCentered()) {
            this.visible = false;
        }
        else {
            this.visible = true;
        }
        this.movable = movable;
        this.$button = $button;
        if (this.movable) {
            this.$button.on('click', () => {
                this.toggleFocal();
            });
            this.addFocalMoveListeners();
        }
        else {
            this.$focal.css({ cursor: 'auto' });
        }
        this.renderFocal();
    }
    addFocalMoveListeners() {
        this.$focal.on('mousedown touchstart', this.handleDragStart.bind(this));
        $(window).on('mouseup touchend', this.handleDragEnd.bind(this));
        $(window).on('mousemove touchmove', this.handleMove.bind(this));
    }
    destruct() {
        this.$focal.off('mousedown touchstart', this.handleDragStart.bind(this));
        $(window).off('mouseup touchend', this.handleDragEnd.bind(this));
        $(window).off('mousemove touchmove', this.handleMove.bind(this));
    }
    handleDragStart(ev) {
        this.dragging = this.movable;
        this.lastX = ev.pageX;
        this.lastY = ev.pageY;
    }
    isCentered() {
        return this.focalPos[0] == 0.5 && this.focalPos[1] == 0.5;
    }
    handleDragEnd() {
        this.dragging = false;
    }
    handleMove(ev) {
        ev.preventDefault();
        if (!this.dragging || this.saving) {
            return;
        }
        const deltaX = ev.pageX - this.lastX;
        const deltaY = ev.pageY - this.lastY;
        if (deltaY !== 0 || deltaX !== 0) {
            this.shouldSave = true;
        }
        // Update last position
        this.lastX = ev.pageX;
        this.lastY = ev.pageY;
        // Figure out where we want to drag the focal
        const currentPosition = this.$focal.position();
        // Make sure to account for the positioning offset
        const desiredLeft = currentPosition.left + deltaX + this.$focal.outerWidth() / 2;
        const desiredTop = currentPosition.top + deltaY + this.$focal.outerHeight() / 2;
        // Make it fit the actual container
        const containerWidth = this.$target.width();
        const containerHeight = this.$target.height();
        const actualLeft = Math.min(Math.max(0, desiredLeft), containerWidth);
        const actualTop = Math.min(Math.max(0, desiredTop), containerHeight);
        // convert to percentage, as that's going to be reliable after resizing, too
        this.focalPos = [
            1 / (containerWidth / actualLeft),
            1 / (containerHeight / actualTop)
        ];
        this.debouncedSave();
        this.positionFocal();
    }
    debouncedSave() {
        if (this.saving) {
            return;
        }
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.storeFocalPosition(), this.debounceTimeout);
    }
    storeFocalPosition() {
        this.saving = true;
        this.renderButton();
        let data = {
            assetUid: this.assetUid,
            focal: (this.visible ? this.focalPos : [0.5, 0.5]).join(';')
        };
        this.$button.parents('.buttons').css({ opacity: 1 });
        Craft.postActionRequest('assets/update-focal-position', data, (() => {
            this.saving = false;
            this.shouldSave = false;
            this.$button.parents('.buttons').css({ opacity: '' });
            this.renderButton();
        }));
    }
    toggleFocal() {
        if (this.saving) {
            return;
        }
        this.visible = !this.visible;
        if (!this.isCentered()) {
            this.shouldSave = true;
        }
        this.renderButton();
        this.debouncedSave();
        this.renderFocal();
    }
    renderButton() {
        if (this.saving) {
            this.$button.text(Craft.t('app', 'Saving...'));
        }
        else {
            if (this.visible) {
                this.$button.text(Craft.t('app', 'Disable focal point'));
            }
            else {
                this.$button.text(Craft.t('app', 'Enable focal point'));
            }
        }
    }
    renderFocal() {
        if (this.visible) {
            this.$focal.show();
            this.positionFocal();
        }
        else {
            this.$focal.hide();
        }
        this.renderButton();
    }
    /**
     * Position focal point correctly
     * @protected
     */
    positionFocal() {
        this.$focal.css({
            left: (this.$target.width() * this.focalPos[0]) - this.$focal.outerWidth() / 2,
            top: (this.$target.height() * this.focalPos[1]) - this.$focal.outerHeight() / 2
        });
    }
}

(function($) {


if (typeof blx.ui == 'undefined')
	blx.ui = {};


/**
 * Create Block Modal
 */
blx.ui.CreateBlockModal = blx.ui.Modal.extend({

	$cancelBtn: null,

	$nameInput: null,
	$handleInput: null,
	$classInput: null,

	$nameErrors: null,
	$handleErrors: null,

	saving: null,

	init: function()
	{
		this.base();

		$.get(baseUrl+'_includes/blocksselect/createblockmodal', $.proxy(this, 'onLoad'));
	},

	onLoad: function(data)
	{
		var $container = $(data);
		$container.appendTo(blx.$body);
		this.setContainer($container);

		this.$cancelBtn = this.$footerBtns.filter('.cancel:first');

		this.$nameInput = this.$body.find('#block-name');
		this.$handleInput = this.$body.find('#block-handle');
		this.$classInput = this.$body.find('#block-class');

		this.saving = false;

		this.handleGenerator = new blx.ui.HandleGenerator(this.$nameInput, this.$handleInput);

		this.addListener(this.$submitBtn, 'click', 'save');
		this.addListener(this.$cancelBtn, 'click', 'hide');

		this.addListener(this.$nameInput, 'keypress,keyup,change,blur', 'onInputChange');
		this.addListener(this.$handleInput, 'keypress,keyup,change,blur', 'onInputChange');

		this.centerInViewport();

		if (this.visible)
			this.show();
	},

	show: function()
	{
		this.reset();
		this.base();
	},

	validate: function()
	{
		if (this.$container)
		{
			if (this.$nameInput.val() && this.$handleInput.val())
			{
				this.$submitBtn.removeClass('disabled');
				return true;
			}

			this.$submitBtn.addClass('disabled');
		}

		return false;
	},

	save: function()
	{
		if (this.saving || !this.validate())
			return;

		this.saving = true;

		this.clearErrors();

		blx.utils.animateWidth(this.$submitBtn, $.proxy(function() {
			this.$submitBtn.addClass('loading');
		}, this));
	
		var data = {
			name: this.$nameInput.val(),
			handle: this.$handleInput.val(),
			'class': this.$classInput.val()
		};

		$.post(actionUrl+'contentblocks/save', data, $.proxy(function(response) {
			if (response.errors)
				this.setErrors(response.errors);
			else if (!response.success)
				alert('An unknown error occurred.');
			else
			{
				var modal = blx.getBlocksSelectModal();
				modal.insertNewBlock(response.id, response.name, response.type);
				this.hide();
			}

			blx.utils.animateWidth(this.$submitBtn, $.proxy(function() {
				this.$submitBtn.removeClass('loading');
			}, this));

			this.saving = false;
		}, this));
	},

	setErrors: function(errors)
	{
		if (errors.name)
		{
			this.$nameInput.addClass('error');
			this.$nameErrors = blx.utils.createErrorList(errors.name);
			this.$nameErrors.insertAfter(this.$nameInput.parent());
		}

		if (errors.handle)
		{
			this.$handleInput.addClass('error');
			this.$handleErrors = blx.utils.createErrorList(errors.handle);
			this.$handleErrors.insertAfter(this.$handleInput.parent());
		}
	},

	clearErrors: function()
	{
		if (this.$nameErrors)
		{
			this.$nameInput.removeClass('error');
			this.$nameErrors.remove();
			this.$nameErrors = null;
		}

		if (this.$handleErrors)
		{
			this.$handleInput.removeClass('error');
			this.$handleErrors.remove();
			this.$handleErrors = null;
		}
	},

	onInputChange: function()
	{
		this.validate();
	},

	reset: function()
	{
		if (!this.$container)
			return;

		this.$nameInput.val('');
		this.$handleInput.val('');
		this.$classInput.val('PlainText');
		this.clearErrors();
		this.validate();
		this.handleGenerator.startListening();

		setTimeout($.proxy(function() {
			this.$nameInput.focus();
		}, this), 1);
		
	}

});


var _modal;

blx.getCreateBlockModal = function()
{
	if (typeof _modal == 'undefined')
		_modal = new blx.ui.CreateBlockModal();

	return _modal;
}


})(jQuery);

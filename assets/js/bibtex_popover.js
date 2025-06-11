document.addEventListener('DOMContentLoaded', function() {
  var myDefaultWhiteList = $.fn.popover.Constructor.Default.whiteList;

  myDefaultWhiteList.pre = ['id', 'class'];
  myDefaultWhiteList.button = ['class', 'data-clipboard-target', 'aria-label', 'title']; // Add aria-label and title
  myDefaultWhiteList.svg = ['class', 'xmlns', 'width', 'height', 'fill', 'viewBox']; // Allow SVG and its attributes
  myDefaultWhiteList.path = ['d']; // Allow the <path> tag inside the SVG

  $('[data-toggle="popover"]').popover({
    html: true,
    sanitize: true,
    whiteList: myDefaultWhiteList,
    template: '<div class="popover bibtex-popover" role="tooltip"><div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>'
  });

  var clipboard = new ClipboardJS('.copy-btn');

  clipboard.on('success', function(e) {
    var originalContent = e.trigger.innerHTML;
    e.trigger.textContent = 'Copied!';
    e.clearSelection();

    setTimeout(function() {
      e.trigger.innerHTML = originalContent;
    }, 2000);
  });

  $('html').on('click', function(e) {
    $('[data-toggle="popover"]').each(function () {
      if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
        $(this).popover('hide');
      }
    });
  });
});

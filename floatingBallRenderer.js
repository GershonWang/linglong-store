const { ipcRenderer } = require('electron');

ipcRenderer.on('set-tooltip', (event, tooltipWindow) => {
  const floatingWindow = window.require('electron').remote.getCurrentWindow();

  document.body.addEventListener('mouseenter', () => {
      tooltipWindow.setBounds({
          x: floatingWindow.getBounds().x - 200,
          y: floatingWindow.getBounds().y + 30,
          width: 200,
          height: 100
      });
      tooltipWindow.show();
  });

  document.body.addEventListener('mouseleave', () => {
      tooltipWindow.hide();
  });
});

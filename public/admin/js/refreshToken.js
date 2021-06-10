/*
 *	TODO: does this require a separate refresh token route that requires admin.
 *	permissions?
 */
$(document).ready(function () {
  setInterval(() => {
    $.ajax({
      url: '/users/refresh-admin-token',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
      },
      type: 'POST',
      data: JSON.stringify({
        refreshToken: getCookie('adminRefreshToken'),
      }),
      success: function (data) {
        localStorage.setItem('adminToken', data.jwtToken);
      },
      error: function (xhr) {
        const errorMessage = xhr.status + ': ' + xhr.statusText;
        localStorage.clear();
        window.alert(`Error - ${errorMessage}`);
        window.location.href = '/admin/';
      },
    });
  }, 100000);
});

function getCookie(cname) {
  const name = cname + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}

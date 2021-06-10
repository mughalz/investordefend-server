$(document).ready(function () {
  $('#logout').click(function (event) {
    $.ajax({
      url: '/users/logout',
      type: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
      },
      success: function (data) {
        localStorage.clear();
        window.alert('Logged out of all devices!');
        window.location.href = '/admin';
      },
      error: function (data) {
        console.error(data.responseJSON);
        alert(data.responseJSON.message);
      },
    });
  });
});

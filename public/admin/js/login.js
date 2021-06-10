if (localStorage.getItem('adminToken')) {
  window.location.href = 'panel.html';
}

$(document).ready(function () {
  $('#signin').submit(function (event) {
    event.preventDefault();

    $.ajax({
      url: '/users/login/admin',
      type: 'POST',
      data: {
        username: $('#username').val(),
        password: $('#password').val(),
      },
      success: function (data) {
        localStorage.setItem('adminToken', data.jwtToken);
        window.location.href = 'panel.html';
      },
      error: function (data) {
        console.error(data.responseJSON);
        alert(data.responseJSON.message);
      },
    });
  });
});

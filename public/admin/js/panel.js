let editors = {
  controls: undefined,
  securityAreas: undefined,
  settings: undefined,
};

function unauthorisedError(data) {
  console.error(data.responseJSON);
  const errorMessage = `401: ${data.responseJSON.message}`;
  window.alert(`Error - ${errorMessage}\n\nYou will now be logged out.`);
  localStorage.removeItem('adminToken');
  window.location.href = '/admin/';
}

function forbiddenError(data) {
  console.error(data.responseJSON);
  const errorMessage = `403: ${data.responseJSON.message}\n\nYou do not have admin. rights, and will now be logged out.`;
  localStorage.removeItem('adminToken');
  window.location.href = '/admin/';
}

const responses = {
  401: (data) => unauthorisedError(data),
  403: (data) => forbiddenError(data),
};

$(document).ready(function () {
  populateOptions('controls');
  populateOptions('securityAreas');
  populateOptions('settings');

  $('.form__input--select').change(function (event) {
    showInput(event.target.id.slice(0, -'Select'.length));
  });

  $('#nuke').click(function () {
    if (!confirm('This will blitz everything, and it is not reversible.\n\nAre you sure?')) {
      return;
    }

    $.ajax({
      type: 'DELETE',
      url: `/reset`,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
      },
      contentType: 'application/json',
      xhrFields: {
        withCredentials: true,
      },
      statusCode: {
        ...responses,
        204: function () {
          window.alert('Success!');
        },
      },
    });
  });

  $('.form--create').submit(function (event) {
    event.preventDefault();

    const type = event.target.id.slice(0, -'Update'.length);

    const values = JSON.parse($(`#${type}CreateInput`).val());

    $.ajax({
      type: 'POST',
      url: `/${type}/create`,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
      },
      data: JSON.stringify({
        newDetails: values,
      }),
      contentType: 'application/json',
      xhrFields: {
        withCredentials: true,
      },
      statusCode: {
        ...responses,
        201: function (data) {
          console.debug(data);
          window.alert('Success!');

          populateOptions('controls');
          populateOptions('securityAreas');
        },
      },
    });
  });

  $('.form--update').submit(function (event) {
    event.preventDefault();

    const id = $(event.target).children('.form__label:nth-of-type(2)').attr('id').slice(0, -'Label'.length);
    const type = event.target.id.slice(0, -'Update'.length);

    switch ($('input[type=submit]:focus').val()) {
      case 'Update':
        let updatedValues;

        if ($(`#${id}UpdateInput`).hasClass('form__input--json')) {
          updatedValues = editors[type].getValue();
        } else {
          updatedValues = $(`#${id}UpdateInput`).val();
        }

        $.ajax({
          type: 'PATCH',
          url: `/${type === 'settings' ? 'games/setting' : type}/update`,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
          },
          data: JSON.stringify(
            type === 'settings'
              ? {
                  key: $('#setting-key').html(),
                  value: updatedValues,
                }
              : {
                  updatedDetails: updatedValues,
                },
          ),
          contentType: 'application/json',
          xhrFields: {
            withCredentials: true,
          },
          statusCode: {
            ...responses,
            200: function () {
              window.alert('Success!');
            },
          },
        });
        break;
      case 'Delete':
        $.ajax({
          type: 'DELETE',
          url: `/${type}/delete`,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
          },
          data: JSON.stringify({ id: id }),
          contentType: 'application/json',
          xhrFields: {
            withCredentials: true,
          },
          statusCode: {
            ...responses,
            204: function () {
              window.alert('Success!');

              populateOptions('controls');
              populateOptions('securityAreas');
            },
          },
        });
        break;
      default:
        throw 'Unknown form submit type!';
    }
  });
});

function populateOptions(type) {
  let url, selectOption;

  switch (type) {
    case 'securityAreas':
      url = '/securityAreas';
      break;
    case 'controls':
      url = '/controls';
      break;
    case 'settings':
      url = '/games/get/settings';
      break;
    default:
      throw 'Unknown option';
  }

  $.ajax({
    url,
    type: 'GET',
    async: false,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
    },
    xhrFields: {
      withCredentials: true,
    },
    statusCode: {
      ...responses,
      200: (items) => {
        items.forEach((item) => {
          $(`select#${type}Select`).append(
            `<option value="${item.key || item.id}">${item.key || item.number + '.&nbsp;' + item.name}</option>`,
          );
        });
        showInput(type);
      },
    },
  });
}

function showInput(type, data = null) {
  if (!data) {
    let url;

    switch (type) {
      case 'securityAreas':
        url = `/securityAreas/${$('select#securityAreasSelect').val()}`;
        break;
      case 'controls':
        url = `/controls/${$('select#controlsSelect').val()}`;
        break;
      case 'settings':
        url = `/games/get/setting/${$('select#settingsSelect').val()}`;
        break;
      default:
        throw 'Unknown option';
    }

    $.ajax({
      url,
      type: 'GET',
      async: false,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
      },
      xhrFields: {
        withCredentials: true,
      },
      statusCode: {
        ...responses,
        200: (data) => {
          showInput(type, data);
        },
      },
    });
  } else {
    const form = $(`.details#${type} .form--update`);

    form.children('.form__input--value').remove();

    const label = form.children('.form__label:nth-of-type(2)');
    label.children('.text__value').text(type === 'settings' ? data.key : data.id);
    if (type === 'settings' && data.description) $('#setting-description').html(data.description);
    else $('#setting-description').html();

    let element;

    const value = data.value || data;

    console.debug(`Type of item: ${typeof value}`);

    switch (typeof value) {
      case 'number':
        element = $('<input>');
        element.addClass('form__input--number');
        element.attr('type', 'number');
        element.val(value);
        break;
      case 'string':
        if (data.length < 80) {
          element = $('<input>');
          element.addClass('form__input--text');
          element.attr('type', 'text');
        } else {
          element = $('<textarea cols="80" rows="40"></textarea>');
          element.addClass('form__input--textarea');
        }
        element.val(value);
        break;
      case 'object':
        if (editors[type] !== undefined) {
          editors[type].destroy();
          editors[type] = undefined;
        }
        element = $(`<div class="form__input--json${Array.isArray(value) ? ' form__input--array' : ''}"></div>`);
        break;
      default:
        throw 'Unknown value type';
    }

    label.attr('for', data.key || data.id).attr('id', `${data.key || data.id}Label`);
    element.attr('id', `${data.key || data.id}UpdateInput`).addClass('form__input--value form__control');
    label.after(element);

    if (typeof value === 'object') {
      const schema = {
        type: Array.isArray(value) ? 'array' : 'object',
        title: data.key || type,
        items: {
          headerTemplate: "{{ i1 }} - {{ self.name }}"
        }
      };

      if (editors[type] === undefined) {
        editors[type] = new JSONEditor(document.getElementById(`${data.key || data.id}UpdateInput`), { schema });
        editors[type].on('ready', () => {
          editors[type].setValue(value);
        });
      }
    }
  }
}

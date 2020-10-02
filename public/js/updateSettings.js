const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

// type is 'success' or 'error'
const showAlert = (type, msg) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, 10000);
};

const updateData = async (data, type) => {
  try {
    const url =
      type === 'Password'
        ? '/api/v1/users/changePassword'
        : '/api/v1/users/updateMe';
    const res = await axios({
      method: 'patch',
      url,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type} updated successfully`);
      window.setTimeout(() => {
        location.assign('/Me');
      }, 1500);
    }
  } catch (err) {
    console.log(err);
    showAlert('error', err.response.data.message);
  }
};

const userDataForm = document.querySelector('.form.form-user-data');
const userPasswordForm = document.querySelector('.form.form-user-password');

if (userDataForm)
  userDataForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.querySelector('.btn--save-settings').text = 'Updating...';

    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    await updateData(form, 'Data');
    document.querySelector('.btn--save-settings').text = 'SAVE SETTINGS';
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.querySelector('.btn--save-password').firstChild.data =
      'Updating...';

    const password = document.getElementById('password-current').value;
    const newpassword = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateData({ password, newpassword, passwordConfirm }, 'Password');

    document.querySelector('.btn--save-password').firstChild.data =
      'SAVE PASSWORD';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

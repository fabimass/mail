document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function send_email(event) {
  event.preventDefault();

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);

      // Load sent mailbox
      load_mailbox('sent');
  });
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Add event listener to form
  document.querySelector('#compose-form').addEventListener('submit', send_email);
}

function open_email(id) {

  // Show single email and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none'
  document.querySelector('#single-email-view').style.display = 'block';

  // Get selected email
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#single-email-view').innerHTML = 
      `<h3>${email.subject}</h3>
       <p>${email.body}</p>`;
  })
  .then(fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  }));

}

function print_email(email) {
  const element = document.createElement('div');
  
  // Create the block of html code that will be injected
  const emailTemplate = 
    `<table>
        <tr>
          <td>${email.sender}</td>
          <td>${email.subject}</td>
          <td style="text-align: right;">${email.timestamp}</td>
        </tr>
     </table>`
  element.innerHTML = emailTemplate;
   
  // Add some css classes
  element.classList.add('email');
  element.classList.add( (email.read) ? "read" : "new" );

  // Add click event
  element.addEventListener('click', () => open_email(email.id));
  
  // Inject email on the view
  document.querySelector('#emails-view').append(element);
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get the emails for the corresponding mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      emails.forEach(email => print_email(email));
  });
}
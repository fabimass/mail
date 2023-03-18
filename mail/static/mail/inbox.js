document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email());

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

function compose_email(to='', subject='', body='') {
  
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = to;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;

  // Add event listener to form
  document.querySelector('#compose-form').addEventListener('submit', send_email);
}

function archive_email(id, to_archive) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: to_archive
    })
  })
  .then(() => load_mailbox('inbox'));
}

function reply_email(email) {

  // Pre-populates the email form
  compose_email(email.sender, 
    `${email.subject.includes('Re:') ? '' : 'Re: '}${email.subject}`, 
    `On ${email.timestamp} ${email.sender} wrote: \n\n${email.body}`);
}

function open_email(id, mailbox) {

  // Get selected email
  fetch(`/emails/${id}`)
  .then(response => response.json())
  // Construct the email element
  .then(email => {
    document.querySelector('#single-email-view').innerHTML = 
      `<div class="expanded">
        <p>From: ${email.sender}</p>
        <p>To: ${email.recipients}</p>
        <p>Timestamp: ${email.timestamp}</p>
        <br/>
        <h3>${email.subject}</h3>
        <p>${email.body}</p>
       </div>
       ${ (mailbox != 'sent') ? 
      `<div class="d-flex flex-row-reverse">
        <button id="archive-button" class="btn btn-primary">${email.archived ? "Unarchive" : "Archive"}</button>
        <button id="reply-button" class="btn btn-primary mx-2">Reply</button>
       </div>` 
       : '' }`;  
       
      // Add listener for the archive button
      archiveButton = document.querySelector('#archive-button');
      archiveButton?.addEventListener('click', () => archive_email(email.id, !email.archived));

      // Add listener for the reply button
      replyButton = document.querySelector('#reply-button');
      replyButton?.addEventListener('click', () => reply_email(email));

      // Mark email as read
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      });
  })
  .then(() => {
    // Show single email and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none'
    document.querySelector('#single-email-view').style.display = 'block';
  });

}

function print_email(email, mailbox) {
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
  element.addEventListener('click', () => open_email(email.id, mailbox));
  
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
      emails.forEach(email => print_email(email, mailbox));
  });
}
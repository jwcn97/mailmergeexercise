const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

require('dotenv').config();

const middlewares = require('./middlewares');

const sgMail = require('@sendgrid/mail')
sgMail.setApiKey("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")
// sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

function renderTemplate(req) {
  var message = req.body.template;
  const matches = message.match(/(?!^)<<.*?>>/g);
  if (matches) {
    var variables = matches.map(v => v.replace("<<","").replace(">>",""));
    variables.forEach(v => message = message.replace(`<<${v}>>`, req.body.recipient.variables[v]));
  }
  return '<p>'+message.replace(/(?:\r\n|\r|\n)/g, '<br/>')+'</p>'
}

app.get('/', (req, res) => {
  res.json({ message: 'welcome to mail merge!' });
});

app.post('/render_template', (req, res) => {
  var message = renderTemplate(req);
  var subject = '<h2>Subject: '+req.body.sender.subject+'</h2>'
  var from = '<h3>From: '+req.body.sender.email+'</h3>'
  var to = '<h3>To: '+req.body.recipient.email+'</h3>'
  var content = '<div style="padding:5px; border-radius:10px; background-color:#f0f0f0">'+message+'</div>'
  res.json({ status: 200, data: subject + from + to + content })
})

app.post('/send_email', (req, res) => {
  var message = renderTemplate(req)
  sgMail.send({
    to: req.body.recipient.email,
    from: req.body.sender.email,
    subject: req.body.sender.subject,
    html: message,
  })
  .then(() => res.json({ data: 'Email sent' }))
  .catch(error => res.json({ data: error }));
})

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;

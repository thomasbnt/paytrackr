require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/sendmail', async (req, res) => {
  const { amount, email } = req.body;
  const msg = {
    to: email,
    from: 'paytrackr@gmail.com',
    templateId: process.env.SENDGRID_TEMPLATE_ID,
    dynamic_template_data: {
      amount,
    },
  };
  console.log('sending', msg);
  try {
    await sgMail.send(msg);
    console.log('sent');
    res.json({
      success: true,
      message: 'Email sent',
    });
  } catch (e) {
    console.log('Error!', e);
    res.json({
      success: false,
      message: 'Email not sent',
    });
  }
});

app.listen(3030, () => {
  console.log('Listening on port 3030...');
});

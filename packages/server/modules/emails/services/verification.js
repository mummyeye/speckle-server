const appRoot = require('app-root-path')
require('dotenv').config({ 'path': `${appRoot}/.env` })
const crs = require('crypto-random-string')

const knex = require(`${appRoot}/db/knex`)
const Verifications = () => knex('email_verifications')

const { getServerInfo } = require(`${appRoot}/modules/core/services/generic`)
const { sendEmail } = require(`${appRoot}/modules/emails`)

const sendEmailVerification = async ({ recipient }) => {
  // we need to validate email here, since we'll send it out,
  // even if technically there is no chance ATM that an incorrect addr comes in
  const serverInfo = await getServerInfo()
  const verificationId = await createEmailVerification({ 'email': recipient })
  const verificationLink = new URL(
     `auth/verifyemail?t=${verificationId}`, process.env.CANONICAL_URL,
  )
  const { text, html, subject } = await prepareMessage(
    { verificationLink, serverInfo },
  )
  return await sendEmail({
    'to': recipient,
    subject,
    text,
    html,
  })
}

const prepareMessage = async ({ verificationLink, serverInfo }) => {
  const subject = `Speckle Server ${serverInfo.name} email verification`
  const text = `
    Hello!

    You have just registered to ${serverInfo.name} Speckle Server,
     or initiated the email verification process manually.

    To finalize the verification process, follow the link below:

    ${verificationLink}

    Warm regards,
    Speckle
    ---
    This email was sent from ${serverInfo.name} at ${process.env.CANONICAL_URL},
     deployed and managed by ${serverInfo.company}.
  `

  const html = `
    Hello!
    <br>
    <br>

    You have just registered to ${serverInfo.name} Speckle Server,
     or initiated the email verification process manually.
    
    <br>
    <br>
    
    To finalize the verification process,
     please <b><a href="${verificationLink}" rel="notrack">click here</a>!</b>
    <br>
    <br>

    If this message looks suspicious,
     please contact the server admin
      ${serverInfo.adminContact ?? 'hello@speckle.systems'}
    <br>
    <br>
    Warm regards,
    <br>
    Speckle 
    <br>
    <br>
    <img 
     src="https://speckle.systems/content/images/2021/02/logo_big-1.png"
     style="width:30px; height:30px;">
    <br>
    <br>
    <caption style="size:8px; color:#7F7F7F; width:400px; text-align: left;">
    This email was sent from ${serverInfo.name} at ${process.env.CANONICAL_URL},
     deployed and managed by ${serverInfo.company}.
    </caption>
  `

  return { text, html, subject }
}

const createEmailVerification = async ({ email }) => {
  const verification = {
    'id': crs({ 'length': 20 }),
    email,
  }
  await Verifications().insert(verification)
  return verification.id
}

(async function main() {
  await sendEmailVerification({ 'recipient': 'gergo@jedlicska.com' })
})()

module.exports= {
  sendEmailVerification
}
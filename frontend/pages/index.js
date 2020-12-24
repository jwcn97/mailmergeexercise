import Head from 'next/head'
import React, { useState, useEffect } from "react";
import styles from './index.module.css'

import { toast, ToastContainer } from 'react-nextjs-toast'
import ReactLoading from 'react-loading'
import Button from '@material-ui/core/Button';
import Chip from "@material-ui/core/Chip";
import ChipInput from 'material-ui-chip-input'
import TextField from '@material-ui/core/TextField';

import Modal from "react-modal";

Modal.setAppElement("#__next");

const modalStyles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)',
    maxWidth              : '50%',
  },
  overlay: {
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.75)'
  }
};

const address = "http://localhost"
const port = "5000"

function showSuccess(message) {
  toast.notify(message, {
    duration: 3,
    title: "Success!",
    type: "success"
  })
}

function showWarning(message) {
  toast.notify(message, {
    duration: 3,
    title: "Warning!",
    type: "info"
  })
}

function showError(message) {
  toast.notify(message, {
    duration: 3,
    title: "Error!",
    type: "error"
  })
}

const chipRenderer = ({ className, chip, handleClick, handleDelete }, key) => (
  <Chip
    className={className}
    key={key}
    label={chip}
    onClick={handleClick}
    onDelete={handleDelete}
  />
);

export default function Home() {
  const [variables, setVariables] = useState([]);
  const [sender, setSender] = useState({
    email: "jingweichan97@gmail.com",
    subject: "",
  })
  const [recipient, setRecipient] = useState({
    email: "",
    variables: {},
  });
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("page loaded");
    document.getElementById("chips").focus()
  }, []);

  function addVariable(variable) {
    // ensure only alphabets pass through
    if (!variable.match(/^[A-Za-z]+$/)) {
      showWarning("Variable name should only consist of alphabets")
      return;
    }
    setVariables([...variables, variable])
  }

  function deleteVariable(variable) {
    if (document.getElementById("template").value.includes(`<<${variable}>>`)) {
      showWarning("Please remove all occurrences of this variable from the template first")
      return;
    }
    setVariables(variables.filter(e => e != variable))
  }

  function updateVariable(key, value) {
    let currentRecipient = recipient;
    currentRecipient.variables[key] = value;
    setRecipient(currentRecipient)
  }

  function checkRecipientEmail() {
    return recipient.email.match(/^\S+@\S+\.\S+$/)
  }

  function renderTemplate() {
    let recipientVariables = {}
    variables.forEach(variable => recipientVariables[variable] = recipient.variables[variable] || "")

    fetch(`${address}:${port}/render_template`, {
      method: "POST",
      body: JSON.stringify({
        template: document.getElementById("template").value,
        sender: sender,
        recipient: {
          email: recipient.email,
          variables: recipientVariables
        },
      }),
      headers: { "Content-Type": "application/json" }
    })
    .then(res => res.json())
    .then(data => {
      setShowPreview(true);
      console.log({ message: data.data })
      document.getElementById("preview").innerHTML = data.data
    })
    .catch(err => {
      console.log(err)
      showError("Could not render template")
    })
  }

  function sendEmail() {
    if (document.getElementById("template").value === "") {
      showWarning("Template cannot be empty");
      return;
    }

    setLoading(true);
    let recipientVariables = {}
    variables.forEach(variable => recipientVariables[variable] = recipient.variables[variable] || "")

    fetch(`${address}:${port}/send_email`, {
      method: "POST",
      body: JSON.stringify({
        template: document.getElementById("template").value,
        sender: sender,
        recipient: {
          email: recipient.email,
          variables: recipientVariables
        },
      }),
      headers: { "Content-Type": "application/json" }
    })
    .then(res => res.json())
    .then(data => {
      console.log(data)
      setLoading(false);
      if (data.data !== "Email sent") {
        showError("Please try again.");
        return;
      }
      showSuccess("Email sent");
    })
    .catch(err => {
      console.log(err)
      showError("Please try again.");
      setLoading(false);
    })
  }

  return (
    <div>
      <Head>
        <title>Mail Merge</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      </Head>

      <main>
        <div className={styles.loading} style={{ display: loading? "block":"none" }}>
          <ReactLoading
            type="spin" height={'20%'} width={'20%'}
            style={{
              position: 'relative', top: "47.5%", left: '47.5%', width: '5%',
              opacity: 0.8
            }}
          />
        </div>

        <div className={styles.title_wrapper}>
          <h1 className={styles.title}>Mail Template Service</h1>
        </div>

        <div className={styles.container}>
          <div className={styles.left_container}>
            <h2>Variables</h2>
            <ChipInput
              id="chips"
              variant="filled"
              style={{ margin: "0 0 40px 0", backgroundColor: "#C5C5C5" }}
              helperText="ADD or DELETE variables here, CLICK on variable to use it in template."
              value={variables}
              onAdd={(chip) => addVariable(chip)}
              onDelete={(chip, index) => deleteVariable(chip)}
              chipRenderer={chipRenderer}
              className={styles.chips}
              onClick={(e) => {
                let value = document.getElementById("template").value;
                let variable = e.target.innerHTML
                if (!variables.includes(variable)) {
                  if (!e.target.children[0] || !variables.includes(e.target.children[0])) return;
                  variable = e.target.children[0].innerHTML
                }
                document.getElementById("template").value += value[value.length-1]===" "? `<<${variable}>>`:` <<${variable}>>`
              }}
            />
            
            <h2>Template</h2>
            <TextField
              variant="filled"
              style={{ backgroundColor: "#C5C5C5" }}
              placeholder="Write your template here..."
              id="template"
              defaultValue=""
              multiline
              rows={10}
            />
          </div>

          <div className={styles.right_container}>
            <div className={styles.card}>
              <h3>Sender: {sender.email}</h3>
              <div className="flex flex-wrap">
                <div className={styles.keys}>
                  <p>Subject: </p>
                </div>
                <div className={styles.values}>
                  <TextField
                    error={sender.subject === ""}
                    helperText={sender.subject !== ""? "":"Required"}
                    defaultValue={sender.subject || ""}
                    onChange={e => setSender({
                      email: sender.email,
                      subject: e.target.value,
                    })}
                  />
                </div>
              </div>
            </div>

            <h2>Recipient Info</h2>

            <div className={styles.card}>
              <div className="flex flex-wrap">
                <div className={styles.keys}>
                  <p>Email: </p>
                </div>
                <div className={styles.values}>
                  <TextField
                    error={!checkRecipientEmail()}
                    helperText={checkRecipientEmail()? "":"Invalid Email."}
                    defaultValue={recipient.email || ""}
                    onChange={e => setRecipient({
                      email: e.target.value,
                      variables: recipient.variables,
                    })}
                  />
                </div>
              </div>
              {variables.map(v => (
                <div className="flex flex-wrap" key={v}>
                  <div className={styles.keys}>
                    <p>{`${v}: `}</p>
                  </div>
                  <div className={styles.values}>
                    <TextField
                      defaultValue={recipient.variables[v] || ""}
                      onChange={e => updateVariable(v, e.target.value)}
                    />
                  </div>
                </div>
              ))}
              <br/>
              <div className={styles.button_container}>
                <Button
                  style={{ margin: "0 5px" }}
                  variant="contained"
                  color="primary"
                  onClick={renderTemplate}
                >
                  show preview
                </Button>
                
                <Button
                  disabled={sender.subject === "" || !checkRecipientEmail()}
                  style={{ margin: "0 5px" }}
                  variant="contained"
                  color="primary"
                  onClick={sendEmail}
                >
                  send
                </Button>
              </div>
            </div>
          </div>
        </div>

        <ToastContainer align={"right"}/>
        <Modal isOpen={showPreview} style={modalStyles} onRequestClose={() => setShowPreview(false)}>
          <div id="preview"></div>
        </Modal>
      </main>

      <style jsx>{`
        main {
          position: relative;
          height: 100%;
          width: 100%;
          background-color: #ebedc0;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        h2 {
          padding: 10px;
        }

        a {
          color: inherit;
          text-decoration: none;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}

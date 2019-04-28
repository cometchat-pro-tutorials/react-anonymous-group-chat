import React from "react";
import { CometChat } from "@cometchat-pro/chat";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Navbar from "react-bootstrap/Navbar";
import { Redirect } from "react-router-dom";
import uuid from "uuid";

class Chat extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      redirect: false,
      user: null,
      receiverID: "supergroup",
      messageText: "",
      messages: [],
      authToken: null,
      messageType: CometChat.MESSAGE_TYPE.TEXT,
      receiverType: CometChat.RECEIVER_TYPE.GROUP
    };
  }

  componentDidMount() {
    this.setState({ user: this.props.location.user });
    this.getUser();
    this.receiveMessages();
  }

  handleChange = e => {
    this.setState({ messageText: e.target.value });
  };

  fetchMessages = () => {
    const GUID = this.state.receiverID;
    const limit = 30;
    const messagesRequest = new CometChat.MessagesRequestBuilder()
      .setGUID(GUID)
      .setLimit(limit)
      .build();

    messagesRequest.fetchPrevious().then(
      messages => {
        const textMessages = messages.filter(msg => msg.type === "text");
        this.setState({ messages: [...textMessages] });
        this.scrollToBottom();
      },
      error => {
        console.log("Message fetching failed with error:", error);
      }
    );
  };

  sendMessage = e => {
    e.preventDefault();
    const { receiverID, messageText, messageType, receiverType } = this.state;
    const textMessage = new CometChat.TextMessage(
      receiverID,
      messageText,
      messageType,
      receiverType
    );

    CometChat.sendMessage(textMessage).then(
      message => {
        this.setState({ messageText: "" });
        const oldMessages = [...this.state.messages];
        const filtered = oldMessages.filter(msg => msg.id !== message);
        this.setState({ messages: [...filtered, message] });
        this.scrollToBottom();
      },
      error => {
        console.log("Message sending failed with error:", error);
      }
    );
  };

  scrollToBottom = () => {
    const page = document.querySelector(".page");
    page.scrollTop = page.scrollHeight;
  };

  receiveMessages = () => {
    const listenerID = "supergroup";

    CometChat.addMessageListener(
      listenerID,
      new CometChat.MessageListener({
        onTextMessageReceived: textMessage => {
          const oldMessages = this.state.messages;
          oldMessages.push(textMessage);
          this.setState(
            {
              messages: [...oldMessages]
            },
            () => this.scrollToBottom()
          );
        }
      })
    );
  };

  joinGroup = () => {
    const GUID = this.state.receiverID;
    const password = "";
    const groupType = CometChat.GROUP_TYPE.PUBLIC;

    CometChat.joinGroup(GUID, groupType, password).then(
      group => {},
      error => {
        if (error.code === "ERR_ALREADY_JOINED") {
          this.reAuthenticateUserWithToken();
        }
      }
    );
  };

  getUser = () => {
    CometChat.getLoggedinUser().then(
      user => {
        this.joinGroup();
      },
      error => {
        const authToken = localStorage.getItem("cometchat:authToken");
        if (authToken !== null) {
          this.setState({ authToken }, () => {
            this.reAuthenticateUserWithToken(this.state.authToken);
          });
        } else {
          this.setState({ redirect: true });
        }
      }
    );
  };

  reAuthenticateUserWithToken = authToken => {
    CometChat.getLoggedinUser()
      .then(u => {
        this.fetchMessages();
      })
      .catch(err => {
        CometChat.login(authToken).then(
          user => {
            this.fetchMessages();
          },
          error => {
            console.log("Login failed with exception:", { error });
          }
        );
      });
  };

  logout = () => {
    CometChat.logout().then(() => {
      localStorage.removeItem("cometchat:authToken");
      this.setState({ redirect: true });
    });
  };

  render() {
    if (this.state.redirect) return <Redirect to="/" />;

    return (
      <div
        className="bg-light page"
        style={{ height: "100vh", overflowX: "hidden" }}
      >
        <Row>
          <Col>
            <Container>
              <div className="d-flex align-items-center justify-content-between">
                <h3 className="text-center py-3 d-inline">
                  React Anonymous Chat
                </h3>
                <Button onClick={e => this.logout()} variant="outline-primary">
                  Logout
                </Button>
              </div>
              <ul className="list-group" style={{ marginBottom: "60px" }}>
                {this.state.messages.length > 0 ? (
                  this.state.messages.map(msg => (
                    <li className="list-group-item" key={uuid()}>
                      <strong>{msg.sender.name}</strong>
                      <p>{msg.text}</p>
                    </li>
                  ))
                ) : (
                  <div className="text-center mt-5 pt-5">
                    <p className="lead text-center">Fetching Messages</p>
                  </div>
                )}
              </ul>
            </Container>
          </Col>
        </Row>

        <Navbar fixed="bottom">
          <Container>
            <Form
              inline
              className="w-100 d-flex justify-content-between align-items-center"
              onSubmit={this.sendMessage}
            >
              <Form.Group style={{ flex: 1 }}>
                <Form.Control
                  value={this.state.messageText}
                  style={{ width: "100%" }}
                  required
                  type="text"
                  placeholder="Type Message here..."
                  onChange={this.handleChange}
                />
              </Form.Group>
              <Button variant="primary" type="submit">
                Send
              </Button>
            </Form>
          </Container>
        </Navbar>
      </div>
    );
  }
}

export default Chat;

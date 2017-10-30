import React from 'react';
import { View, Text, AsyncStorage } from 'react-native';
import SocketIOClient from 'socket.io-client';
import { GiftedChat } from 'react-native-gifted-chat';

const USER_ID = '@userId';


class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      userId: null,
    };


    //this.inform=''
    this.determineUser = this.determineUser.bind(this);
    this.onReceivedMessage = this.onReceivedMessage.bind(this);
    this.onSend = this.onSend.bind(this);
    this._storeMessages = this._storeMessages.bind(this);
    this.onList20Message = this.onList20Message.bind(this)

    this.socket = SocketIOClient('http://localhost:3000');
    this.socket.on('message', this.onReceivedMessage);
    this.socket.on('LOGIN_VERIFY', this.onLoginVerify);
    this.socket.on('USER_COME_IN', this.onUserComeIn);
    this.socket.on('LIST_ALL_USER', this.onListAllUser);
    this.socket.on('LIST_20_MESSAGE', this.onList20Message)
    this.socket.on('RECEIVE_MESSAGE', this.onReceiveMessage)
    this.determineUser();
  }

  static xxx = 'xxx'

  /**
   * When a user joins the chatroom, check if they are an existing user.
   * If they aren't, then ask the server for a userId.
   * Set the userId to the component's state.
   */
  determineUser() {
    AsyncStorage.getItem(USER_ID)
      .then((userId) => {
        // If there isn't a stored userId, then fetch one from the server.
        if (!userId) {
          this.socket.emit('userJoined', null);
          this.socket.on('userJoined', (userId) => {
            AsyncStorage.setItem(USER_ID, userId);
            this.setState({ userId });
          });
        } else {
          this.socket.emit('userJoined', userId);
          this.setState({ userId });
        }
      })
      .catch((e) => alert(e));
  }

  // Event listeners
  /**
   * When the server sends a message to this.
   */
  onReceivedMessage(messages) {
    this._storeMessages(messages);
  }



  onLoginVerify(success) {
    //this.inform = this.inform + 'LOGIN_VERIFY: '+success.success
    xxx = 'LOGIN_VERIFY: '+success.success
    //alert(xxx)
  }

  onUserComeIn(user) {
    //this.inform = this.inform+'USER_COME_IN: '+user.userid
    xxx += 'USER_COME_IN: '+user
  }

  onListAllUser(online_user){
    xxx = 'LIST_ALL_USER: '+online_user
    alert(xxx);
  }

  onList20Message(msg){
    var time = new Date().getTime()
    var timestr = new Date().toLocaleString();
    alert('List20Message');
    this.socket.emit('GIVE_MESSAGE',{'fromuser':'Apple', 'touser':'KiKi', 'message':'banana love apple', 'time':time, 'timestr':timestr})
    
  }
  onReceiveMessage(msg){
    xxx = 'RECEIVE_MESSAGE: '+msg
    alert(xxx);
  }
  

  /**
   * When a message is sent, send the message to the server
   * and store it in this component's state.
   */
  onSend(messages=[]) {
    alert('in onSend'+messages);
    //this.socket.emit('USER_LOGIN', {'userid':messages[0].text,'password':'123345'});
    var time = new Date().getTime()
    var timestr = new Date().toLocaleString();
    this.socket.emit('ENTER_ROOM', {'fromuser':messages[0].text,'touser':'Apple'});
    this.socket.emit('NEXT_20_MESSAGE', {'fromuser':messages[0].text,'touser':'Apple', 'time':1509035540735, 'timestr':"2017/10/27 上午12:32:20"})
    //this.socket.join('AppleTom')
    this.socket.emit('NEXT_20_MESSAGE', {"fromuser":"Apple" , "touser":messages[0].text ,"timestr":timestr ,"time":time})
    this.socket.emit('EXIT_ROOM', {"fromuser":"Apple" , "touser":messages[0].text })
    this.socket.emit('USER_LOGOUT',{"userid":messages[0].text})
    this.socket.emit('disconnect')
    this._storeMessages(messages);
  }

  render() {
    var user = { _id: this.state.userId || -1 };

    return (
      <GiftedChat
        messages={this.state.messages}
        onSend={this.onSend}
        user={user}
      />
    );
  }

  // Helper functions
  _storeMessages(messages) {
    this.setState((previousState) => {
      return {
        messages: GiftedChat.append(previousState.messages, messages),
      };
    });
  }
}

module.exports = Main;

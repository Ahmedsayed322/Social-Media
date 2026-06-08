const baseURL = 'http://localhost:3000';
const token = `Bearer ${localStorage.getItem('token')}`;

let globalProfile = {};

const headers = {
  'Content-Type': 'application/json; charset=UTF-8',
  authorization: token,
};
const clintIo = io(baseURL, {
  auth: { token: token },
});

clintIo.on('connect_error', (err) => {
  console.log('connect_error:', err.message);
});

clintIo.on('custom_error', (err) => {
  console.log('custom_error:', err.message);
});

clintIo.emit('sayHi', 'FROM FE TO BE', (response) => {
  console.log({ response });
});
clintIo.on('offline_user', (data) => {
  console.log({ data });
});

// clintIo.on("likePost", data => {
//     console.log({ likeData: data })
// })

//images links
let avatar = './avatar/Avatar-No-Background.png';
let meImage = './avatar/Avatar-No-Background.png';
let friendImage = './avatar/Avatar-No-Background.png';

// // // // // // collect messageInfo
function sendMessage(sendTo, type) {
  console.log({ sendTo, type });
  if (type == 'ovo') {
    const data = {
      content: $('#messageBody').val(),
      sendTo,
    };
    console.log({ data });

    clintIo.emit('send_message', data);
  } else if (type == 'group') {
    const data = {
      content: $('#messageBody').val(),
      groupId: sendTo,
    };
    clintIo.emit('sendGroupMessage', data);
  }
}

// // // // // //sendCompleted
clintIo.on('success_message', (data) => {
  const { content } = data;
  const div = document.createElement('div');

  div.className = 'me text-end p-2';
  div.dir = 'rtl';
  const imagePath = globalProfile.pfp
    ? `${baseURL}/uploads/${globalProfile.pfp}`
    : avatar;
  div.innerHTML = `
    <img class="chatImage" src="${imagePath}" alt="" srcset="">
    <span class="mx-2">${content}</span>
    `;
  document.getElementById('messageList').appendChild(div);
  $('.noResult').hide();
  $('#messageBody').val('');
});

// // // // // // // // // //receiveMessage
clintIo.on('new_message', (data) => {
  console.log({ RM: data });
  const { content, from, groupId } = data;
  console.log({ from });

  let imagePath = avatar;
  if (from?.pfp) {
    imagePath = `${baseURL}/uploads/${from.pfp}`;
  }
  const onclickAttr = document
    .getElementById('sendMessage')
    .getAttribute('onclick');
  const [base, currentOpenedChat] =
    onclickAttr?.match(/sendMessage\('([^']+)'/) || [];
  console.log({ currentOpenedChat });
  console.log({ onclickAttr, currentOpenedChat });
  console.log(!groupId && currentOpenedChat === from._id);

  if (
    (!groupId && currentOpenedChat === from._id) ||
    (groupId && currentOpenedChat === groupId)
  ) {
    console.log('here');

    if (from._id.toString() != globalProfile._id.toString()) {
      console.log('here ss');

      const div = document.createElement('div');
      div.className = 'myFriend p-2';
      div.dir = 'ltr';
      div.innerHTML = `
    <img class="chatImage" src="${imagePath}" alt="" srcset="">
    <span class="mx-2">${content}</span>
    `;
      document.getElementById('messageList').appendChild(div);
    }
  } else {
    if (groupId) {
      $(`#g_${groupId}`).show();
    } else {
      $(`#c_${from._id}`).show();
    }
    const audio = document.getElementById('notifyTone');
    audio.currentTime = 0; // restart from beginning
    audio.play().catch((err) => console.log('Audio play blocked:', err));
  }
});

// // // // // // // ******************************************************************** Show chat conversation
function showData(sendTo, chat) {
  document
    .getElementById('sendMessage')
    .setAttribute('onclick', `sendMessage('${sendTo}' , "ovo")`);

  document.getElementById('messageList').innerHTML = '';
  console.log(chat);

  if (chat.messages?.length) {
    $('.noResult').hide();
    for (const message of chat.messages) {
      if (message.sender.toString() == globalProfile._id.toString()) {
        const div = document.createElement('div');
        div.className = 'me text-end p-2';
        div.dir = 'rtl';
        div.innerHTML = `
                <img class="chatImage" src="${meImage}" alt="" srcset="">
                <span class="mx-2">${message.content}</span>
                `;
        document.getElementById('messageList').appendChild(div);
      } else {
        const div = document.createElement('div');
        div.className = 'myFriend p-2';
        div.dir = 'ltr';
        div.innerHTML = `
                <img class="chatImage" src="${friendImage}" alt="" srcset="">
                <span class="mx-2">${message.content}</span>
                `;
        document.getElementById('messageList').appendChild(div);
      }
    }
  } else {
    const div = document.createElement('div');

    div.className = 'noResult text-center  p-2';
    div.dir = 'ltr';
    div.innerHTML = `
        <span class="mx-2">Say Hi to start the conversation.</span>
        `;
    document.getElementById('messageList').appendChild(div);
  }

  $(`#c_${sendTo}`).hide();
}

// // // // // // // // //get chat conversation between 2 users and pass it to ShowData fun
function displayChatUser(userId) {
  console.log({ userId });
  axios({
    method: 'get',
    url: `${baseURL}/api/auth/${userId}/chat`,
    headers,
  })
    .then(function (response) {
      console.log({ response });
      const { chat } = response.data;

      console.log(chat);
      if (chat) {
        if (
          chat.participants[0]._id.toString() == globalProfile._id.toString()
        ) {
          meImage = chat.participants[0].pfp
            ? `${baseURL}/uploads/${chat.participants[0].pfp}`
            : avatar;
          friendImage = chat.participants[1].pfp
            ? `${baseURL}/uploads/${chat.participants[1].pfp}`
            : avatar;
        } else {
          meImage = chat.participants[1].pfp
            ? `${baseURL}/uploads/${chat.participants[1].pfp}`
            : avatar;
          friendImage = chat.participants[0].pfp
            ? `${baseURL}/uploads/${chat.participants[0].pfp}`
            : avatar;
        }

        showData(userId, chat);
      } else {
        showData(userId, 0);
      }
    })
    .catch(function (error) {
      console.log(error);
      console.log({ status: error.status });
      if (error.status == 400) {
        showData(userId, 0);
      } else {
        alert('Ops something went wrong');
      }
    });
}

// // // // // // // ********************************************************************
// // // // // // // ******************************************************************** Show  group chat conversation
// // // // function showGroupData(sendTo, chat) {
// // // //     document.getElementById("sendMessage").setAttribute("onclick", `sendMessage('${sendTo}' , "group")`);

// // // //     document.getElementById('messageList').innerHTML = ''
// // // //     if (chat.messages?.length) {
// // // //         $(".noResult").hide()
// // // //         console.log(chat.messages);

// // // //         for (const message of chat.messages) {

// // // //             if (message.createdBy?._id.toString() == globalProfile._id.toString()) {
// // // //                 const div = document.createElement('div');
// // // //                 div.className = 'me text-end p-2';
// // // //                 div.dir = 'rtl';
// // // //                 div.innerHTML = `
// // // //                 <img class="chatImage" src="${meImage}" alt="" srcset="">
// // // //                 <span class="mx-2">${message.content}</span>
// // // //                 `;
// // // //                 document.getElementById('messageList').appendChild(div);
// // // //             } else {

// // // //                 const div = document.createElement('div');
// // // //                 div.className = 'myFriend p-2';
// // // //                 div.dir = 'ltr';
// // // //                 const friendImage = message.createdBy.profilePicture ? `${baseURL}/upload/${message.createdBy.profilePicture}` : avatar
// // // //                 div.innerHTML = `
// // // //                 <img class="chatImage" src="${friendImage}" alt="" srcset="">
// // // //                 <span class="mx-2">${message.content}</span>
// // // //                 `;
// // // //                 document.getElementById('messageList').appendChild(div);
// // // //             }

// // // //         }
// // // //     } else {
// // // //         const div = document.createElement('div');

// // // //         div.className = 'noResult text-center  p-2';
// // // //         div.dir = 'ltr';
// // // //         div.innerHTML = `
// // // //         <span class="mx-2">Say Hi to start the conversation.</span>
// // // //         `;
// // // //         document.getElementById('messageList').appendChild(div);
// // // //     }
// // // //     $(`#g_${sendTo}`).hide();

// // // // }
// // // // // // // // ********************************************************************
// // // // function displayGroupChat(groupId) {
// // // //     console.log({ groupId });
// // // //     axios({
// // // //         method: 'get',
// // // //         url: `${baseURL}/chat/group/${groupId}`,
// // // //         headers
// // // //     }).then(function (response) {
// // // //         const { chat } = response.data?.data
// // // //         console.log({ chat });
// // // //         if (chat) {
// // // //             meImage = globalProfile.profilePicture ? `${baseURL}/upload/${globalProfile.profilePicture}` : avatar
// // // //             showGroupData(groupId, chat)
// // // //         } else {
// // // //             showGroupData(groupId, 0)
// // // //         }

// // // //     }).catch(function (error) {
// // // //         console.log(error);
// // // //         console.log({ status: error.status });
// // // //         if (error.status == 404) {
// // // //             showGroupData(groupId, 0)
// // // //         } else {
// // // //             alert("Ops something went wrong")
// // // //         }

// // // //     });
// // // // }
// // // // // // ==============================================================================================

// // // // // // ********************************************************* Show Users list
// // // // // Display Users

async function getUserData() {
  const query = `
 query GetMyProfile {
    getMyProfile {
        _id
        firstName
        lastName
        email
        gender
        password
        provider
        role
        pfp
        gallery
        createdAt
        updatedAt
        changeCredentials
        friends {
            _id
            firstName
            lastName
            pfp
        }
    }
}

`;
  axios({
    method: 'post',
    url: `${baseURL}/graphql`,
    headers,
    data: JSON.stringify({ query }),
  })
    .then(function (response) {
      console.log({ D: response.data });
      const { groups } = response.data || {};
      const user = response.data?.data?.getMyProfile;
      console.log({ user });
      globalProfile = user;
      let imagePath = avatar;
      if (user.pfp) {
        imagePath = `${baseURL}/uploads/${user.pfp}`;
      }
      document.getElementById('profileImage').src = imagePath;
      document.getElementById('userName').innerHTML =
        `${user.firstName} ${user.lastName}`;
      showUsersData(user.friends);
      // showGroupList(groups)
    })
    .catch(function (error) {
      console.log(error);
    });
}
// // // // // Show friends list
function showUsersData(users = []) {
  console.log(users);

  let cartonna = ``;
  for (let i = 0; i < users.length; i++) {
    let imagePath = avatar;
    if (users[i].pfp) {
      imagePath = `${baseURL}/uploads/${users[i].pfp}`;
    }
    cartonna += `
        <div onclick="displayChatUser('${users[i]._id}')" class="chatUser my-2">
        <img class="chatImage" src="${imagePath}" alt="" srcset="">
        <span class="ps-2">${users[i].firstName} ${users[i].lastName}</span>
        <span id="${'c_' + users[i]._id}" class="ps-2 closeSpan">
           🟢
        </span>
    </div>

        `;
  }

  document.getElementById('chatUsers').innerHTML = cartonna;
}

// // // // // // // // Show groups list
// // // // function showGroupList(groups = []) {
// // // //     let cartonna = ``
// // // //     for (let i = 0; i < groups.length; i++) {
// // // //         let imagePath = avatar;
// // // //         if (groups[i].group_image) {
// // // //             imagePath = `${baseURL}/upload/${groups[i].group_image}`
// // // //         }
// // // //         cartonna += `
// // // //         <div onclick="displayGroupChat('${groups[i]._id}')" class="chatUser my-2">
// // // //         <img class="chatImage" src="${imagePath}" alt="" srcset="">
// // // //         <span class="ps-2">${groups[i].group}</span>
// // // //            <span id="${"g_" + groups[i]._id}" class="ps-2 closeSpan">
// // // //            🟢
// // // //         </span>
// // // //     </div>

// // // //         `
// // // //         clintIo.emit("join_room", { roomId: groups[i].roomId })

// // // //     }

// // // //     document.getElementById('chatGroups').innerHTML = cartonna;
// // // // }

getUserData();

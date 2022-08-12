<template>
  <transition class="animated zoomIn">
     <div class="video-content" ref="videoContent" v-show="showVideo">
      <div class="avatar-wave-jieting" v-if="showJieting && othersInfo">
        <!-- <h3>来电</h3> -->
        <div class="ripple-wave">
          <div class="ripple-wave-2">
        <img class="avatar" :src="'//app.nihaoshijie.com.cn/upload/avatar/avatar'+othersInfo.avatar" />
      </div>
        </div>
        <div class="person-one">{{othersInfo.name}}</div>
      </div>
     	<video v-show="localStream" class="localvideo" ref="localvideo" autoplay playsinline muted></video>
     	<video v-show="remoteStream" class="remotevideo" ref="remotevideo" autoplay playsinline></video>
       <div class="tools">
       	<div class="jinyan tools-icon"></div>
       	<div class="jieting tools-icon" @click="jietingCall" v-show="showJieting"></div>
       	<div class="hang_up tools-icon" @click="guaduanCall" v-show="showGuaduan"></div>
     	</div>
     </div>
  </transition>
  <div class="room">
    <div class="avatar-wave-top">
      <div class="ripple-wave">
        <div class="ripple-wave-2">
			<img class="avatar" :src="'//app.nihaoshijie.com.cn/upload/avatar/avatar'+info.avatar" />
		</div>
      </div>
      <div class="person-one">{{info.name}}</div>
    </div>
    <div class="avatar-wave-bottom" v-if="othersInfo">
      <div class="ripple-wave">
        <div class="ripple-wave-2">
			<img class="avatar" :src="'//app.nihaoshijie.com.cn/upload/avatar/avatar'+othersInfo.avatar" />
		</div>
      </div>
      <div class="person-one">{{othersInfo.name}}</div>
    </div>
    <div v-if="full" style="color: #fff;font-size: 22px;">房间人数已满..</div>
  	<div v-if="!full" :class="['call', 'bubbly-button',othersInfo ? '':'disabled']" @click="makeCall">{{othersInfo?'Connect':'等待另一个用户进入房间...'}}</div>
  </div>
</template>

<script>

export default {
  name: 'App', 
  components: {

  },
  data(){
  	return {
      info:{
        name: Date.now(),
        avatar: Math.ceil(Math.random() * 9 )+'.jpg',
      },
		  othersInfo:'',
  		state:'init',
  		room: "person2",
  		showVideo: false, // 显示视频
  		showJieting: false,// 显示接听界面
  		showGuaduan: false,// 显示挂断界面
  		remoteStream:null,// 本地视频流
  		localStream:null,// 远端视频流
      full:false,// 房间满人标志位
  		pcConfig: {// webrtc建立点对点的对等连接需要用到iceServers，否则只能在内网局域网使用
	  	  'iceServers': [{
	  	    'urls': 'turn:stun.ukerd.com:3478',// 免费直接可用的iceserver列表  https://gist.github.com/yetithefoot/7592580，也可以自建
	  	    'credential': "123456",
	  	    'username': "lvming"
	  	  }]
	  	}
  	}
  },
  watch:{
    // 人满后页面不可点击，置灰
    full(val){
      if (val) {
        document.documentElement.classList.add('gray')
      } else {
        document.documentElement.classList.remove('gray')
      }
    }
  },
  mounted(){
    window.onerror = function(msg,url,line,col,error){
      alert(msg)
    }

	let url = window.location.origin
	if (process.env.NODE_ENV == 'development') {
		url = 'http://localhost:3003/'
	}


    // 初始化socket.io
  	this.socket = io.connect(url,{
  	  path:'/rtcket'
  	});

  	this.socket.emit('join', {
  		room: this.room,
  		info:this.info
  	});

  	this.localVideo = this.$refs.localvideo
  	this.remoteVideo = this.$refs.remotevideo

  	this.socketMessage()
  },
  methods:{
  	socketMessage(){
  		this.socket.on('message', (room, id, data) => {

  		  if (data.type == 3) {
  		    this.getCall()
  		  } else if (data.type == 7) {
  		    this.leave();

  		  } else if(data.type == 4 ||data.type == 5||data.type == 6){
  		      var callData = data.data;
  		      if (callData.hasOwnProperty('type') && callData.type === 'offer') {

  		        this.createAnswer(callData)
  		      } else if (callData.hasOwnProperty('type') && callData.type == 'answer') {
  		        this.pc.setRemoteDescription(new RTCSessionDescription(callData));
  		  
  		      } else if (callData.hasOwnProperty('type') && callData.type === 'candidate') {
  		        var candidate = new RTCIceCandidate({
  		          sdpMLineIndex: callData.label,
  		          candidate: callData.candidate
  		        });
  		        this.pc.addIceCandidate(candidate);
  		  
  		      } else {
  		        console.log('the message is invalid!', callData);
  		      }
  		    }
  		})
      // 加入房间成功后
  		this.socket.on("joined", (data,id) => {
        // 设置当前用户和对方用户信息
  			for (var key in data) {
  				if (data[key]) {
  					if (key == id) {
  						this.info = data[key].info
  					} else {
  						this.othersInfo = data[key].info
  					}
  				}

  			}

  		});
      // 当前用户离开房间
  		this.socket.on("leaved", () => {

  		});
      // 其他人进入房间
  		this.socket.on('otherjoin', (data) => {
  			this.othersInfo = data.info

  		});
      // 其他人离开房间
  		this.socket.on('otherleave', () => {
  			this.othersInfo = ''
        this.leave();

  		});
      // 人满了
  		this.socket.on('full', (roomid, rooms) => {


        this.renderFull(rooms)


  		});
  	},
    renderFull(rooms){
      this.full = true;

      let count = 0;
      for (let key in rooms) {
        if (rooms[key] && rooms[key].info && count < 2) {
          if (count == 1) {

            this.othersInfo = rooms[key].info
          } else {
            this.info = rooms[key].info
          }
          count++
          
        }
      }
    },
  	sendMessage(type, data) {
  	  this.socket.emit("message", this.room, { type: type, data: data });
  	},
    animateButton(e){

      e.preventDefault;
      //reset animation
      e.target.classList.remove('animate');
      
      e.target.classList.add('animate');


      return new Promise((resolve)=>{
        setTimeout(function(){
          e.target.classList.remove('animate');
          resolve()
        },900);
      })
    },
    // 拨打电话
  	async makeCall(e){
      await this.animateButton(e)
  		this.state = 'call'
  		this.showVideo = true;
  		this.showGuaduan = true;
  		this.showJieting = false;
  		await this.initLocalStream()

  		this.sendMessage(3, "calling")
  	},
    // 挂断电话
  	guaduanCall(){
  		console.log('guaduanCall')
  		this.leave();

  		this.sendMessage(7,'init');

  	},
    // 收到来电电话
  	getCall(){
  		console.log('getCall')
  		this.showVideo = true;
  		this.showGuaduan = false;
  		this.showJieting = true;
  	},
    // 接听来电
  	async jietingCall(){

		this.showJieting = false;
  		this.showGuaduan = true;
  		
  		await this.initLocalStream()
  		await this.call()
  	},
    // 发起点对点通信
  	async call() {
  	  const offerOptions = {
  	    offerToRecieveAudio: 1,
  	    offerToRecieveVideo: 1
  	  }
  	  let desc = await this.pc.createOffer(offerOptions)

  	  this.offerdesc = desc;
  	  this.pc.setLocalDescription(desc);
  	  
  	  this.sendMessage(4, desc);

  	},
    // 初始化本地视频
  	async initLocalStream(){
  		if (!navigator.mediaDevices ||
  		  !navigator.mediaDevices.getUserMedia) {
  		  console.error('the getUserMedia is not supported!');
  		  alert('您的浏览器暂不支持getUserMedia，请使用Safari打开')

  		  return;
  		} else {
  		  // alert(JSON.stringify(navigator.mediaDevices.getSupportedConstraints()))
  		  const constraints = {
  		    video: window.navigator.userAgent.indexOf('Chrome') > -1 ? { width: {ideal:window.innerWidth}, height: {ideal:window.innerHeight} } : true,// 在移动端暂不支持width和height属性
  		    audio: {
  		      echoCancellation: true,
  		      noiseSuppression: true,
  		      autoGainControl: true
  		    }
  		  }
        let stream = null
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints)
        }catch(e){
          alert(e)
        }
  		  
  		  
  		  this.localStream = this.getMediaStream(stream)

  		  this.localVideo.srcObject = this.localStream;
        this.localVideo.play()

  		  this.bindTracks();
  		}
  	},
  	getMediaStream(stream){
  		if (this.localStream) {
  		  
  		  stream.getAudioTracks().forEach((track) => {
  		    this.localStream.addTrack(track);
  		    stream.removeTrack(track);
  		  });
  		} else {
  		  this.localStream = stream;
  		}

  		return this.localStream
  		
  	},
  	async createAnswer(callData){
  		this.pc.setRemoteDescription(new RTCSessionDescription(callData));
  		let desc = await this.pc.createAnswer()
  		this.pc.setLocalDescription(desc);
  		this.sendMessage(5, desc);
  	},
  	bindTracks() {
  	  console.log('bind tracks into RTCPeerConnection!');

  	  if (this.pc === null || this.pc === undefined) {
  	    //console.error('pc is null or undefined!');
  	    //return;
  	    this.createPeerConnection();
  	  }

  	  if (this.localStream === null || this.localStream === undefined) {
  	    console.error('localstream is null or undefined!');
  	    this.closePc();
  	    return;
  	  }

  	  this.localStream.getTracks().forEach((track) => {
  	    this.pc.addTrack(track, this.localStream);
  	  });

  	},
  	createPeerConnection() {

  	  console.log('create RTCPeerConnection!');
  	  if (!this.pc) {
  	    this.pc = new RTCPeerConnection(this.pcConfig);
  	    this.pc.onicecandidate = (e) => {

  	      if (e.candidate) {
  	        var data = { type: 'candidate', label: event.candidate.sdpMLineIndex, id: event.candidate.sdpMid, candidate: event.candidate.candidate };

  	        this.sendMessage(6, data);
  	      } else {
  	        console.log('this is the end candidate');
  	      }
  	    }
  	    this.pc.ontrack = this.getRemoteStream;
  	  } else {
  	    console.log('the pc have be created!');
  	  }

  	},
  	getRemoteStream(e) {
  	  // remoteStream = e.streams[0];
  	  this.remoteStream = e.streams[0];
  	  this.remoteVideo.srcObject = this.remoteStream;
      this.remoteVideo.play()

  	},
  	closePc() {
  	  if (this.pc) {
  	    this.offerdesc = null;
  	    this.pc.close();
  	    this.pc = null;
  	  }

  	},
  	leave(){
  		this.showVideo = false;
  		this.closeLocalMedia()
  		this.closePc()
  		this.localStream = null
  		this.remoteStream = null
  	},
  	closeLocalMedia() {
  	  if (this.localStream && this.localStream.getTracks()) {
  	    this.localStream.getTracks().forEach((track) => {
  	      track.stop();
  	    });
  	  }
  	  this.localStream = null;
  	}
  }
}
</script>
<style>
	.video-content {
		width: 100%;
		height: 100%;
		background-color: rgb(33, 26, 37);
		position: absolute;
		z-index: 999;
	}
	.video-content.animated {
		animation-duration: 0.4s;
	}
	.tools {
		width: 100%;
		height: 70px;
		position: absolute;
		bottom: 40px;
		display: flex;
		justify-content: center;
		z-index: 10
	}
	.tools-icon {
		width: 50px;
		height: 50px;
		background-size: 100% 100%;
		background-repeat: no-repeat;
    
	}
  .tools-icon:first-child {
    margin-right: 20px;
  }
	.jinyan {
		background-image: url('./assets/jinyan.svg');

	}
	.jieting {
		background-image: url('./assets/jieting.svg');
	}
	.hang_up {
		background-image: url('./assets/hang_up.svg');
	}
	.localvideo {
		width: 100%;
		height: 100%;
    object-fit: fill;
	}
	.remotevideo {
		position: absolute;
		width: 30%;
		height: 30%;
		right: 0;
		bottom: 0;
    z-index: 9;
    object-fit: fill;
	}
  .avatar-wave-jieting {
    position: absolute;
    width: 200px;
    height: 200px;
    left: 50%;
    transform: translateX(-50%);
    top: 167px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .avatar-wave-top {
    position: absolute;
    width: 200px;
    height: 200px;
    left: 50%;
    transform: translateX(-50%);
    top: 67px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .avatar-wave-bottom {
    position: absolute;
    width: 200px;
    height: 200px;
    left: 50%;
    transform: translateX(-50%);
    bottom: 67px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .person-one {
    margin-top: 20px;
    color: #fff;
  }
  @keyframes pulse-animation {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    20% {
      opacity: 1;
      transform: scale(1);
    }
    80% {
      opacity: 0;
    }
    100% {
      opacity: 0;
      transform: scale(1.5);
    }
  }
  .room {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    top: 0;
    background-color: rgb(33, 26, 37);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .avatar {
    display: block;
    width: 89px;
    height: 89px;
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 99;
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }
  .ripple-wave {
    position: relative;
    border-radius: 50%;
    z-index: 1;
    margin: 0 auto;
    width: 100px;
    height: 100px;
  }
  .avatar-wave-jieting .ripple-wave::before,.avatar-wave-jieting .ripple-wave::after {
    background-color: #1aad19;
  }
  .ripple-wave::before, .ripple-wave::after {
    content: "";
    display: block;
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: #fff;
    will-change: transform, opacity;
  }
  .ripple-wave::after {
    animation: pulse-animation 2s cubic-bezier(0.24, 0, 0.38, 1) infinite;
    transition: opacity 0.4s, transform 0.4s;
  }
  .ripple-wave .ripple-wave-2 {
    position: absolute;
    height: inherit;
    width: inherit;
  }
  .avatar-wave-jieting .ripple-wave .ripple-wave-2::before {
    background-color: #1aad19;
  }
  .ripple-wave .ripple-wave-2::before {
    content: "";
    display: block;
    height: inherit;
    width: inherit;
    border-radius: 50%;
    background-color: #fff;
    animation: pulse-animation 2s cubic-bezier(0.24, 0, 0.38, 1) infinite;
    animation-delay: 0.24s;
  }
  .bubbly-button {
    width: auto;
    padding-left: 5px;
    padding-right: 5px;
    height: 34px;
    text-align: center;
    line-height: 34px;
	
  }
  .bubbly-button.disabled {
    background-color: #ccc;
    box-shadow: none;
  }
  .bubbly-button {
    display: inline-block;
    -webkit-appearance: none;
    appearance: none;
    background-color: #ff0081;
    color: #fff;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    position: relative;
    transition: transform ease-in 0.1s, box-shadow ease-in 0.25s;
    box-shadow: 0 2px 25px rgba(255, 0, 130, 0.5);
  }
  .bubbly-button:focus {
    outline: 0;
  }
  .bubbly-button:before, .bubbly-button:after {
    position: absolute;
    content: "";
    display: block;
    width: 140%;
    height: 100%;
    left: -20%;
    z-index: -1000;
    transition: all ease-in-out 0.5s;
    background-repeat: no-repeat;
  }
  .bubbly-button:before {
    display: none;
    top: -75%;
    background-image: radial-gradient(circle, #ff0081 20%, transparent 20%), radial-gradient(circle, transparent 20%, #ff0081 20%, transparent 30%), radial-gradient(circle, #ff0081 20%, transparent 20%), radial-gradient(circle, #ff0081 20%, transparent 20%), radial-gradient(circle, transparent 10%, #ff0081 15%, transparent 20%), radial-gradient(circle, #ff0081 20%, transparent 20%), radial-gradient(circle, #ff0081 20%, transparent 20%), radial-gradient(circle, #ff0081 20%, transparent 20%), radial-gradient(circle, #ff0081 20%, transparent 20%);
    background-size: 10% 10%, 20% 20%, 15% 15%, 20% 20%, 18% 18%, 10% 10%, 15% 15%, 10% 10%, 18% 18%;
  }
  .bubbly-button:after {
    display: none;
    bottom: -75%;
    background-image: radial-gradient(circle, #ff0081 20%, transparent 20%), radial-gradient(circle, #ff0081 20%, transparent 20%), radial-gradient(circle, transparent 10%, #ff0081 15%, transparent 20%), radial-gradient(circle, #ff0081 20%, transparent 20%), radial-gradient(circle, #ff0081 20%, transparent 20%), radial-gradient(circle, #ff0081 20%, transparent 20%), radial-gradient(circle, #ff0081 20%, transparent 20%);
    background-size: 15% 15%, 20% 20%, 18% 18%, 20% 20%, 15% 15%, 10% 10%, 20% 20%;
  }
  .bubbly-button:active {
    transform: scale(0.9);
    background-color: #e60074;
    box-shadow: 0 2px 25px rgba(255, 0, 130, 0.2);
  }
  .bubbly-button.animate:before {
    display: block;
    animation: topBubbles ease-in-out 0.75s forwards;
  }
  .bubbly-button.animate:after {
    display: block;
    animation: bottomBubbles ease-in-out 0.75s forwards;
  }

  @keyframes topBubbles {
    0% {
      background-position: 5% 90%, 10% 90%, 10% 90%, 15% 90%, 25% 90%, 25% 90%, 40% 90%, 55% 90%, 70% 90%;
    }
    50% {
      background-position: 0% 80%, 0% 20%, 10% 40%, 20% 0%, 30% 30%, 22% 50%, 50% 50%, 65% 20%, 90% 30%;
    }
    100% {
      background-position: 0% 70%, 0% 10%, 10% 30%, 20% -10%, 30% 20%, 22% 40%, 50% 40%, 65% 10%, 90% 20%;
      background-size: 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%;
    }
  }
  @keyframes bottomBubbles {
    0% {
      background-position: 10% -10%, 30% 10%, 55% -10%, 70% -10%, 85% -10%, 70% -10%, 70% 0%;
    }
    50% {
      background-position: 0% 80%, 20% 80%, 45% 60%, 60% 100%, 75% 70%, 95% 60%, 105% 0%;
    }
    100% {
      background-position: 0% 90%, 20% 90%, 45% 70%, 60% 110%, 75% 80%, 95% 70%, 110% 10%;
      background-size: 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%;
    }
  }
</style>
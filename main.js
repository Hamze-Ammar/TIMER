function timerApp() {
  return {
    showAddTimer: false,
    requestResume: false,
    timers: [],
    logs: [],
    newTimer: {
      id: null,
      name: '',
      duration: '',
      durationInitial: '',
      unit: '',
      color: 'blue',
      classes: '',
      sound: 'beep',
      interval: null,
      timeLeft: 0,
      endsAtFormatted: null,
      endsAt: null, // timestamp
      isPaused: false,
      isPlaying: false,
      isPlayingSound: false,
      showLogs: false,
    },
    init: function() {
      this.timers = JSON.parse(localStorage.getItem('timers')) || [];
      this.logs = JSON.parse(localStorage.getItem('timersLogs')) || [];

      // play sound if timer is playing
      this.timers.forEach((timer, index) => {
        
        if (timer.isPlayingSound) {
          // this.hardResetTimer(timer);
        }
        // if timer is paused, set timeLeft to duration
        if (timer.isPlaying || timer.isPlayingSound) {
          timer.interval = null;

          // get timeLeft from endsAt
          if (timer.endsAt) {
            const timeLeft = Math.floor((timer.endsAt - Date.now()) / 1000);
            timer.timeLeft = timeLeft;
            timer.endsAtFormatted = this.getFormattedEndsAt(timer);
          } else {
            timer.timeLeft = timer.duration;
          }
          this.$nextTick(() => {
            this.startTimer(timer);
          });

          this.requestResume = true;
        }

      });
      

      this.$watch('timers', (newValue) => {
        this.save();
      });
      this.$watch('logs', (newValue) => {
        this.saveLogs();
      });
    },
    getTimerLogs(timer) {
      const timerId = timer.id;
      return this.logs.filter(log => log.timerId === timerId);
    },
    save() {
      console.log('save');
      
      localStorage.setItem('timers', JSON.stringify(this.timers));
    },

    closeResumeModal() {
      console.log('closeResumeModal');
      
      this.requestResume = false;
    },

    isNegative(seconds) {
      if (seconds === null || seconds === undefined) {
        return false;
      }
      return seconds < 0;
    },

    formatTime(seconds) {
      console.log('formatTime', seconds);
      if (seconds === null || seconds === undefined) {
        return '';
      }
      if (seconds < 0) {
        seconds = Math.abs(seconds);
        return `-${this.formatTime(seconds)}`;
      }
      
      const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
      const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      return `${hrs}:${mins}:${secs}`;
    },

    addTimer() {
      console.log('Adding timer:', this.newTimer);
      
      if (!this.newTimer.name) {
        this.newTimer.name = 'TIMER NAME';
      };
      if (!this.newTimer.duration) {
        this.newTimer.duration = 4;
      };
      if (!this.newTimer.unit) {
        this.newTimer.unit = 'seconds';
      };
      if (!this.newTimer.durationInitial) {
        this.newTimer.durationInitial = this.newTimer.duration;
      };

      if (this.newTimer.unit === 'minutes') {
        this.newTimer.duration *= 60;
      } else if (this.newTimer.unit === 'hours') {
        this.newTimer.duration *= 3600;
      }
      if (this.newTimer.unit === 'seconds') {
        this.newTimer.duration *= 1;
      } else if (this.newTimer.unit === 'days') {
        this.newTimer.duration *= 86400;
      }
      if (this.newTimer.unit === 'weeks') {
        this.newTimer.duration *= 604800;
      } else if (this.newTimer.unit === 'months') {
        this.newTimer.duration *= 2592000;
      }
      if (this.newTimer.unit === 'years') {
        this.newTimer.duration *= 31536000;
      }
      // validate duration
      if (this.newTimer.duration <= 0) {
        alert('Please enter a valid duration');
        return;
      }

      const classes = `bg-${this.newTimer.color}-500 text-white font-bold rounded`;

      const timer = {
        id: Math.random().toString(36).substr(2, 9),
        name: this.newTimer.name,
        timeLeft: parseInt(this.newTimer.duration),
        duration: parseInt(this.newTimer.duration),
        color: this.newTimer.color,
        classes: classes,
        sound: this.newTimer.sound,
        durationInitial: this.newTimer.durationInitial,
        unit: this.newTimer.unit,
        isPaused: false,
        isPlaying: false,
        isPlayingSound: false,
        interval: null
      }
      this.timers.push(timer);

      this.newTimer.name = '';
      this.newTimer.duration = '';
      this.newTimer.durationInitial = '';

      this.showAddTimer = false;
      this.log(timer, 'add');
    },

    formatDate(timestamp) {
      const date = new Date(timestamp);
      const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
      return date.toLocaleDateString('en-US', options);
    },

    stopAlarm(timer) {
      if (timer.isPlayingSound) {
        this.stopSound(timer.sound);
      }
      this.hardResetTimer(timer);
    },

    singularizeUnit(timer) {
      if (timer.durationInitial.toString() === "1") {
        return timer.unit.slice(0, -1);
      }
      return timer.unit;
    },

    startTimer(timer) {
      if (timer.interval) {
        return;
      } else {
        timer.isPlaying = true;
        timer.isPaused = false;
        timer.isPlayingSound = false;
        timer.endsAt = Date.now() + ( timer.timeLeft * 1000 );
        timer.endsAtFormatted = this.getFormattedEndsAt(timer);

        this.log(timer, 'start');
      }

      const timerEl = document.querySelector(`[data-id='${timer.id}']`);
      if(!timerEl) {
        console.error('Timer element not found');
        return;
      }

      const circle = timerEl.querySelector(".progress-ring__circle");
      const radius = circle.r.baseVal.value;
      console.log('radius', radius);
      
      const circumference = 2 * Math.PI * radius;
      console.log('circumference', circumference);
      
      circle.style.strokeDasharray = `${circumference}`;
      circle.style.strokeDashoffset = `${circumference}`;

      function setProgress(percent) {
        const offset = circumference - (percent / 100) * circumference;
        console.log('offset', offset);
        
        circle.style.strokeDashoffset = circumference - offset;
      }
      setProgress((timer.timeLeft / timer.duration) * 100);


      timer.interval = setInterval(() => {
        timer.timeLeft--;
        if (timer.timeLeft >= 0) {

          setProgress((timer.timeLeft / timer.duration) * 100);
          
        } else if( !timer.isPlayingSound) {
          timer.isPlaying = false;
          timer.isPlayingSound = true;
          this.playSound(timer.sound);
        }

        if( timer.timeLeft < 0 && !timer.isNegative) {
          timer.isNegative = true;
        }
      }, 1000);

    },

    hardResetTimer(timer) {
      if (timer.interval) {
        clearInterval(timer.interval);
        timer.interval = null;
        timer.isPlaying = false;
      }
      timer.isPaused = false;
      timer.timeLeft = parseInt(timer.duration);
      timer.endsAt = null;
      timer.endsAtFormatted = null;
      timer.isPlayingSound = false;
      timer.isNegative = false;

      this.log(timer, 'stop');
    },

    getFormattedEndsAt(timer) {
      const endDate = new Date(Date.now() + timer.timeLeft * 1000);
    
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
      const month = months[endDate.getMonth()];
      const day = endDate.getDate();
      const hours = String(endDate.getHours()).padStart(2, '0');
      const minutes = String(endDate.getMinutes()).padStart(2, '0');
      const seconds = String(endDate.getSeconds()).padStart(2, '0');
    
      return `${month}, ${day} ${hours}:${minutes}:${seconds}`;
    },

    pauseTimer(index) {
      const timer = this.timers[index];
      if (timer.interval) {
        clearInterval(timer.interval);
        timer.interval = null;
        timer.isPlaying = false;
        timer.isPaused = true;

        this.log(timer, 'pause');
      }
    },

    playSound(sound) {
      const audio = document.getElementById(sound.split('.')[0]);

      if (audio) {
        if (audio.dataset.loop === "true") {
          // If already playing in loop, pause and reset
          audio.pause();
          audio.currentTime = 0;
          audio.dataset.loop = "false";
        } else {
          // Play in loop
          audio.loop = true;
          audio.play();
          audio.dataset.loop = "true";
        }
      }
    },

    stopSound(sound) {
      const audio = document.getElementById(sound.split('.')[0]);

      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.loop = false;
        audio.dataset.loop = "false";
      }
    },

    removeTimer(index) {
      if(confirm('Are you sure you want to delete this timer?')) {
        const timer = this.timers[index];
        if (timer.interval) {
          clearInterval(timer.interval);
          timer.interval = null;
        }
        if (timer.isPlayingSound) {
          this.stopSound(timer.sound);
          timer.isPlayingSound = false;
        }
        this.timers.splice(index, 1);
        localStorage.setItem('timers', JSON.stringify(this.timers));
        if (this.timers.length === 0) {
          localStorage.removeItem('timers');
        }

        this.clearTimerLogs(timer);
      } 
    },

    clearTimerLogs(timer){
      const timerId = timer.id;
      this.logs = this.logs.filter(log => log.timerId !== timerId);
      this.saveLogs();
    },

    log(timer, action) {
      const timestamp = Date.now();
      let msg = '';
      switch (action) {
        case 'add':
          msg = `Added timer: ${timer.name} (${timer.duration} ${timer.unit})`;
          break;
        case 'start':
          msg = `Started timer: ${timer.name}`;
          break;
        case 'pause':
          msg = `Paused timer: ${timer.name}`;
          break;
        case 'resume':
          msg = `Resumed timer: ${timer.name}`;
          break;
        case 'stop':
          msg = `Stopped timer: ${timer.name}`;
          break;
        default:
          msg = `Unknown action: ${action}`;
          break;
      }

      this.logs.push({
        timestamp: timestamp,
        action: action,
        msg: msg,
        timerId: timer.id,
      });
    },

    saveLogs() {
      localStorage.setItem('timersLogs', JSON.stringify(this.logs));
    }
  };
}
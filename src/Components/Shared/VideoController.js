// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../Shared/Assert.js";
import { EventController } from "../../Shared/Event.js";

export class VideoController {
   /** @type {EventController<void>} */
   #onUpdateVolume = new EventController();
   /** @type {EventController<void>} */
   #onUpdatePlaybackState = new EventController();
   /** @type {EventController<void>} */
   #onUpdatePosition = new EventController();
   
   /** @type {HTMLVideoElement?} */
   #videoElement = null;
   /** @type {boolean} */
   static #initialIsMuted = false;
   /** @type {boolean} */
   #initialPlaying = false;
   /** @type {number} */
   static #initialVolume = 1;
   /** @type {boolean} */
   static #initalLoop = true;

   get onUpdateVolume() { return this.#onUpdateVolume.event; }
   get onUpdatePosition() { return this.#onUpdatePosition.event; }
   get onUpdatePlaybackState() { return this.#onUpdatePlaybackState.event; }

   get hasEnded() { 
      return this.#videoElement !== null && this.#videoElement.currentTime === this.#videoElement.duration; 
   }

   get videoElement() { 
      return this.#videoElement; 
   }
   set videoElement(value) {
      if (value !== this.#videoElement) {
         if (value !== null) {
            Assert.class(value, HTMLVideoElement);
         }

         if (this.#videoElement !== null) {
            this.#videoElement.removeEventListener("timeupdate", this.#handleTimeUpdate);
            this.#videoElement.removeEventListener("ended", this.#handleEnded);
            this.#videoElement.pause();
         }

         this.#videoElement = value;

         this.loop = VideoController.#initalLoop;
         this.muted = VideoController.#initialIsMuted;
         if (this.#initialPlaying) {
            this.play();
         }
         this.volume = VideoController.#initialVolume;

         if (this.#videoElement !== null) {
            this.#videoElement.addEventListener("timeupdate", this.#handleTimeUpdate);
            this.#videoElement.addEventListener("ended", this.#handleEnded);
         }
      }
   }

   get hasVideoElement() {
      return this.#videoElement != null;
   }

   get durationSeconds() {
      let videoDuration = this.#videoElement?.duration ?? 0;
      return isFinite(videoDuration) ? videoDuration : 0;
   }

   get positionSeconds() { 
      return this.#videoElement?.currentTime ?? 0;
   }
   set positionSeconds(value) { 
      if (this.#videoElement) {
         value = Math.max(0, value);
         if (this.#videoElement.currentTime !== value) {
            this.#videoElement.currentTime = value;
            this.#onUpdatePosition.trigger();
         }
      }
   }

   get progress() { 
      if (this.durationSeconds > 0) {
         return (100 / this.durationSeconds) * this.positionSeconds;
      } else {
         return 0;
      }
   }
   set progress(value) { 
      if (this.durationSeconds > 0) {
         this.positionSeconds = this.durationSeconds * (Math.max(Math.min(value, 100), 0) / 100);
      }
   }

   get progressInfoShort() {
      return `-${this.remaining}`;
   }

   get progressInfo() {
      return `${this.position}/${this.duration}`;
   }

   get position() { 
      return VideoController.formatSecondsAsTimeSpan(this.positionSeconds); 
   }

   get remaining() {
      return VideoController.formatSecondsAsTimeSpan(this.remainingSeconds);
   }

   get remainingSeconds() {
      return this.durationSeconds - this.positionSeconds;
   }

   get duration() { 
      return VideoController.formatSecondsAsTimeSpan(this.durationSeconds);
   }

   get loop() {
      return this.#videoElement?.loop ?? VideoController.#initalLoop;
   }
   set loop(value) {
      Assert.boolean(value);
      VideoController.#initalLoop = value;

      if (this.#videoElement !== null && this.#videoElement.loop !== VideoController.#initalLoop) {         
         this.#videoElement.loop = VideoController.#initalLoop;
      }
   }

   get muted() { 
      return this.#videoElement?.muted ?? VideoController.#initialIsMuted;
   }
   set muted(value) {
      Assert.boolean(value);

      let valueChanged = VideoController.#initialIsMuted !== value;
      VideoController.#initialIsMuted = value;

      if (this.#videoElement !== null && this.#videoElement.muted !== VideoController.#initialIsMuted) {         
         this.#videoElement.muted = VideoController.#initialIsMuted;
      }

      if (valueChanged) {
         this.#onUpdateVolume.trigger();
      }
   }

   get volume() {
      return this.#videoElement?.volume ?? VideoController.#initialVolume;
   }
   set volume(value) {
      VideoController.#initialVolume = Math.max(Math.min(1, value), 0);

      if (this.#videoElement && this.#videoElement.volume !== VideoController.#initialVolume) {
         this.#videoElement.volume = VideoController.#initialVolume;
         this.#onUpdateVolume.trigger();
      }
   }

   get playing() { 
      if (this.#videoElement !== null) {
         return !!(this.#videoElement.currentTime > 0 && !this.#videoElement.paused && 
            !this.#videoElement.ended && this.#videoElement.readyState > 2);
      } else {
         return false; 
      }
   }

   get shouldBePlaying() { return this.#initialPlaying; }

   togglePlay() {
      if (this.shouldBePlaying) {
         this.pause();
      } else {
         if (this.hasEnded) {
            this.seekTo(0);
         }
         this.play();
      }
   }

   toggleMute() {
      this.muted = !this.muted;
   }

   /**
    * @param {number} delta The difference in volume (e.g. 0.25 for a 25% increase in volume).
    */
   changeVolume(delta) {
      let newVolume = Math.max(Math.min(1, this.volume + delta), 0);

      if (newVolume !== this.volume || this.muted) {
         if (this.muted) {
            this.muted = false;
         }
         this.volume = newVolume;
      }
   }

   play() {
      this.#videoElement?.play();
      this.#initialPlaying = true;
      this.#onUpdatePlaybackState.trigger();
   }

   pause() {
      this.#videoElement?.pause();
      this.#initialPlaying = false;
      this.#onUpdatePlaybackState.trigger();
   }

   /**
    * @param {number} targetTime The target time (in seconds).
    */
   seekTo(targetTime) {
      if (this.#videoElement !== null) {
         if (this.#videoElement.currentTime !== targetTime) {
            this.#videoElement.currentTime = targetTime;
         }
      }
   }

   /**
    * @param {number} timeDelta The time difference (in seconds).
    */
   seekBy(timeDelta) {
      if (this.#videoElement !== null) {
         let targetTime = this.#videoElement.currentTime + timeDelta;
         if (this.#videoElement.currentTime !== targetTime) {
            this.#videoElement.currentTime = targetTime;
         }
      }
   }

   /**
    * @param {number} seconds 
    * @returns {string}
    */
   static formatSecondsAsTimeSpan(seconds) {
      let minutesExact = seconds / 60;
      let minutes = Math.floor(minutesExact);
      let minuteSeconds = Math.floor((minutesExact - minutes) * 60);
      minutes += Math.floor(minuteSeconds / 60);
      minuteSeconds = minuteSeconds % 60;
      return `${minutes.toString().padStart(2, "0")}:${minuteSeconds.toString().padStart(2, "0")}`;
   }

   #handleTimeUpdate = () => {
      this.#onUpdatePosition.trigger();
   };
   
   #handleEnded = () => {
      this.#initialPlaying = false;
      this.#onUpdatePlaybackState.trigger();
   };
}
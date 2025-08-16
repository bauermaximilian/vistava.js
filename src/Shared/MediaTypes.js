// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "./Assert.js";

export class MediaTypes {
   static get jpeg() { return "image/jpeg"; }
   static get png() { return "image/png"; }
   static get gif() { return "image/gif"; }
   static get svg() { return "image/svg+xml"; }
   static get webp() { return "image/webp"; }

   static get mp4() { return "video/mp4"; }
   static get webm() { return "video/webm"; }
   static get oggVideo() { return "video/ogg"; }

   /**
    * @param {string|null|undefined} mediaType 
    * @returns {boolean}
    */
   static isSupportedImageType(mediaType) {
      if (typeof(mediaType) === "string") {
         switch (mediaType.trim().toLowerCase()) {
            case MediaTypes.jpeg: 
            case MediaTypes.png: 
            case MediaTypes.gif:
            case MediaTypes.svg: 
            case MediaTypes.webp: 
               return true;
            default: 
               return false;
         }
      } else {
         return false;
      }
   }

   /**
    * @param {string|null|undefined} mediaType 
    * @returns {boolean}
    */
   static isSupportedVideoType(mediaType) {
      if (typeof(mediaType) === "string") {
         switch (mediaType.trim().toLowerCase()) {
            case MediaTypes.mp4: 
            case MediaTypes.webm: 
            case MediaTypes.oggVideo: 
               return true;
            default: 
               return false;
         }
      } else {
         return false;
      }
   }

   /**
    * @param {string} uri 
    * @returns {string}
    */
   static getFileTypeFromUrl(uri) {
      Assert.string(uri, "uri");
      const ext = uri.split(".").pop()?.toLowerCase();
      switch (ext) {
         case "jpg":
         case "jpeg":
            return "image/jpeg";
         case "png":
            return "image/png";
         case "gif":
            return "image/gif";
         case "webp":
            return "image/webp";
         case "mp4":
            return "video/mp4";
         case "mkv":
            return "video/x-matroska";
         case "avi":
            return "video/avi";
         case "mov":
            return "video/quicktime";
         case "webm":
            return "video/webm";
         case "wav":
            return "audio/wav";
         case "mp3":
            return "audio/mpeg";
         case "ogg":
            return "audio/ogg";
         case "flac":
            return "audio/flac";
         default:
            return "application/octet-stream";
      }
   }

}
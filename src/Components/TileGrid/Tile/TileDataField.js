// SPDX-License-Identifier: GPL-3.0-or-later

/** @typedef {keyof(TileDataField)} TileDataFieldKey */

/**
 * Defines a collection of standard keys (with their expected types) of entries within
 * a {@link TileModel} data storage.
 */
export const TileDataField = Object.freeze({
   /** 
    * Defines a {@link string} field that contains the URL to a thumbnail image. 
    * Used in combination with {@link TileDataField.thumbnailType}.
    */
   thumbnailUrl: "thumbnailUrl",
   /** 
    * Defines a {@link string} field that contains the MIME type of a thumbnail image. 
    * Used in combination with {@link TileDataField.thumbnailUrl}.
    */
   thumbnailType: "thumbnailType",
   /** 
    * Defines a {@link string} field that contains the URL to a multimedia item (video, image,...). 
    * Used in combination with {@link TileDataField.mediaType}.
    */
   mediaUrl: "mediaUrl",
   /** 
    * Defines a {@link string} field that contains the MIME type of a multimedia item. 
    * Used in combination with {@link TileDataField.mediaUrl}.
    */
   mediaType: "mediaType",
   /** 
    * Defines a {@link number} field that contains the duration/length of a multimedia item in seconds, if available. 
    * Used in combination with {@link TileDataField.mediaUrl}.
    */
   mediaDuration: "mediaDuration",
   /** 
    * Defines a {@link string} field that contains the URL to a full-sized preview image of a multimedia item.
    * Used in combination with {@link TileDataField.mediaPreviewType}.
    */
   mediaPreviewUrl: "mediaPreviewUrl",
   /** 
    * Defines a {@link string} field that contains the MIME type of a full-sized preview image of a multimedia item.
    * Used in combination with {@link TileDataField.mediaPreviewUrl}.
    */
   mediaPreviewType: "mediaPreviewType",
   /**
    * Defines the name of a {@link GuiIcon}.
    */
   iconName: "iconName",
   /**
    * Defines a query that the user would be navigated to upon interacting with a tile.
    */
   targetQuery: "targetQuery",
   /** 
    * Defines a {@link string} field that contains a displayable short label. 
    */
   label: "label",   
});
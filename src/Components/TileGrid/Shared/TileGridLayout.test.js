// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../../Shared/Assert.js";
import { RU } from "../../../Utils/RectangleUtils.js";
import { VU } from "../../../Utils/VectorUtils.js";
import { TileFlows } from "./TileFlowType.js";
import { TileGridLayout } from "./TileGridLayout.js";
import { TileGridLayoutType } from "./TileGridLayoutType.js";

export class TileGridLayoutTest {
   #tileSizeLength = 200;
   #tileSize = VU.new(this.#tileSizeLength, this.#tileSizeLength);
   //#tileLongerSize = VU.new(this.#tileSizeLength, this.#tileSizeLength * 2);
   #tileShorterSize = VU.new(this.#tileSizeLength, this.#tileSizeLength / 2);
   #containerSizeLength = 500;
   #containerSize = VU.new(this.#containerSizeLength, this.#containerSizeLength);
   #layoutType = new TileGridLayoutType({
      columnWidth: this.#tileSizeLength,
      tileFlow: TileFlows.vertical,
      tileLength: null,
      tileGap: 10
   });

   constructor_validArguments_initializesCorrectly() {
      let layout = new TileGridLayout(this.#layoutType, this.#containerSize);

      Assert.equals(0, layout.tilesCount);
      Assert.equals(2, layout.columnCount);
      Assert.equals(this.#containerSizeLength, layout.containerLength); 
      Assert.equals(null, layout.startPosition);
      Assert.equals(null, layout.startPositionMaximum);
      Assert.equals(null, layout.endPosition);
      Assert.equals(null, layout.endPositionMinimum);
      Assert.equals(null, layout.columnWithBiggestTileIndex);
      Assert.equals(null, layout.columnWithSmallestTileIndex);
      Assert.equals(this.#layoutType.columnWidth, layout.columnWidth);
      Assert.equals(true, layout.hasEmptyColumns);
      Assert.equals(null, layout.firstTileIndex);
      Assert.equals(null, layout.lastTileIndex);
   }

   add_singleQuadraticTile_calculatesLocationAndUpdatesCorrectly() {
      const expectedLocations = [
         { x: 45, y: 0, width: this.#tileSize.x, height: this.#tileSize.y }];
      const expectedFirstLastInColumns = [
         { first: true, last: true }
      ];
      
      let layout = this.#createAndAssertLayoutIsAsExpected(expectedLocations, expectedFirstLastInColumns, {
         0: this.#tileSize
      });

      Assert.equals(0, layout.startPosition);
      Assert.equals(0, layout.startPositionMaximum);
      Assert.equals(200, layout.endPosition); 
      Assert.equals(200, layout.endPositionMinimum);
      Assert.equals(0, layout.columnWithSmallestTileIndex);
      Assert.equals(0, layout.columnWithBiggestTileIndex);
      Assert.equals(true, layout.hasEmptyColumns);
   }

   add_twoQuadraticTiles_calculatesLocationAndUpdatesCorrectly() {
      const expectedLocations = [
         { x: 45, y: 0, width: this.#tileSize.x, height: this.#tileSize.y },
         { x: 255, y: 0, width: this.#tileSize.x, height: this.#tileSize.y }];
      const expectedFirstLastInColumns = [
         { first: true, last: true },
         { first: true, last: true }
      ];
      
      let layout = this.#createAndAssertLayoutIsAsExpected(expectedLocations, expectedFirstLastInColumns, {
         0: this.#tileSize,
         1: this.#tileSize
      });

      Assert.equals(0, layout.startPosition);
      Assert.equals(0, layout.startPositionMaximum);
      Assert.equals(200, layout.endPosition); 
      Assert.equals(200, layout.endPositionMinimum);
      Assert.equals(0, layout.columnWithSmallestTileIndex);
      Assert.equals(1, layout.columnWithBiggestTileIndex);
      Assert.equals(false, layout.hasEmptyColumns);
   }

   add_threeQuadraticTiles_calculatesLocationAndUpdatesCorrectly() {
      const expectedLocations = [
         { x: 45, y: 0, width: this.#tileSize.x, height: this.#tileSize.y },
         { x: 255, y: 0, width: this.#tileSize.x, height: this.#tileSize.y },
         { x: 45, y: 210, width: this.#tileSize.x, height: this.#tileSize.y }];
      const expectedFirstLastInColumns = [
         { first: true, last: false },
         { first: true, last: true },
         { first: false, last: true }
      ];
      
      let layout = this.#createAndAssertLayoutIsAsExpected(expectedLocations, expectedFirstLastInColumns, {
         0: this.#tileSize,
         1: this.#tileSize,
         2: this.#tileSize
      });

      Assert.equals(0, layout.startPosition);
      Assert.equals(0, layout.startPositionMaximum);
      Assert.equals(410, layout.endPosition); 
      Assert.equals(200, layout.endPositionMinimum);
      Assert.equals(0, layout.columnWithSmallestTileIndex);
      Assert.equals(0, layout.columnWithBiggestTileIndex);
      Assert.equals(false, layout.hasEmptyColumns);
   }

   add_threeQuadraticTilesInDifferentOrder_calculatesLocationAndUpdatesCorrectly() {
      const expectedLocations = [
         { x: 45, y: 0, width: this.#tileSize.x, height: this.#tileSize.y },
         { x: 255, y: 0, width: this.#tileSize.x, height: this.#tileSize.y },
         { x: 45, y: 210, width: this.#tileSize.x, height: this.#tileSize.y }];
      const expectedFirstLastInColumns = [
         { first: true, last: false },
         { first: true, last: true },
         { first: false, last: true }
      ];
      
      let layout = this.#createAndAssertLayoutIsAsExpected(expectedLocations, expectedFirstLastInColumns, {
         1: this.#tileSize,
         0: this.#tileSize,
         2: this.#tileSize
      });

      Assert.equals(0, layout.startPosition);
      Assert.equals(0, layout.startPositionMaximum);
      Assert.equals(410, layout.endPosition); 
      Assert.equals(200, layout.endPositionMinimum);
      Assert.equals(0, layout.columnWithSmallestTileIndex);
      Assert.equals(0, layout.columnWithBiggestTileIndex);
      Assert.equals(false, layout.hasEmptyColumns);
   }

   add_oneQuadraticTileTwoSmallerOnes_calculatesLocationAndUpdatesCorrectly() {
      const expectedLocations = [
         { x: 45, y: 0, width: this.#tileSize.x, height: this.#tileSize.y },
         { x: 255, y: 0, width: this.#tileShorterSize.x, height: this.#tileShorterSize.y },
         { x: 255, y: 110, width: this.#tileShorterSize.x, height: this.#tileShorterSize.y }];
      const expectedFirstLastInColumns = [
         { first: true, last: true },
         { first: true, last: false },
         { first: false, last: true }
      ];
      
      let layout = this.#createAndAssertLayoutIsAsExpected(expectedLocations, expectedFirstLastInColumns, {
         0: this.#tileSize,
         1: this.#tileShorterSize,
         2: this.#tileShorterSize
      });

      Assert.equals(0, layout.startPosition);
      Assert.equals(0, layout.startPositionMaximum);
      Assert.equals(210, layout.endPosition); 
      Assert.equals(200, layout.endPositionMinimum);
      Assert.equals(0, layout.columnWithSmallestTileIndex);
      Assert.equals(1, layout.columnWithBiggestTileIndex);
      Assert.equals(false, layout.hasEmptyColumns);
   }

   move_singleQuadraticTile_calculatesLocationAndUpdatesCorrectly() {
      const expectedLocations = [
         { x: 45, y: 50, width: this.#tileSize.x, height: this.#tileSize.y }];
      const expectedFirstLastInColumns = [
         { first: true, last: true }
      ];
      
      let layout = this.#createAndAssertLayoutIsAsExpected(expectedLocations, expectedFirstLastInColumns, {
         0: this.#tileSize
      }, 50);

      Assert.equals(50, layout.startPosition);
      Assert.equals(50, layout.startPositionMaximum);
      Assert.equals(250, layout.endPosition); 
      Assert.equals(250, layout.endPositionMinimum);
      Assert.equals(0, layout.columnWithSmallestTileIndex);
      Assert.equals(0, layout.columnWithBiggestTileIndex);
      Assert.equals(true, layout.hasEmptyColumns);
   }

   move_twoQuadraticTiles_calculatesLocationAndUpdatesCorrectly() {
      const expectedLocations = [
         { x: 45, y: -50, width: this.#tileSize.x, height: this.#tileSize.y },
         { x: 255, y: -50, width: this.#tileSize.x, height: this.#tileSize.y }];
      const expectedFirstLastInColumns = [
         { first: true, last: true },
         { first: true, last: true }
      ];
      
      let layout = this.#createAndAssertLayoutIsAsExpected(expectedLocations, expectedFirstLastInColumns, {
         0: this.#tileSize,
         1: this.#tileSize
      }, -50);

      Assert.equals(-50, layout.startPosition);
      Assert.equals(-50, layout.startPositionMaximum);
      Assert.equals(150, layout.endPosition); 
      Assert.equals(150, layout.endPositionMinimum);
      Assert.equals(0, layout.columnWithSmallestTileIndex);
      Assert.equals(1, layout.columnWithBiggestTileIndex);
      Assert.equals(false, layout.hasEmptyColumns);
   }

   // getReferenceRowTileIndices_sixDifferentTiles_generatesValidReferenceRowIndicesFromEveryTile() {
   //    const expectedLocations = [
   //       { x: 45, y: 50, width: this.#tileSize.x, height: this.#tileSize.y },
   //       { x: 255, y: 50, width: this.#tileShorterSize.x, height: this.#tileShorterSize.y },
   //       { x: 255, y: 160, width: this.#tileShorterSize.x, height: this.#tileShorterSize.y },
   //       { x: 45, y: 260, width: this.#tileSize.x, height: this.#tileSize.y },
   //       { x: 255, y: 270, width: this.#tileSize.x, height: this.#tileSize.y },
   //    ];
   //    const expectedFirstLastInColumns = [
   //       { first: true, last: false },
   //       { first: true, last: false },
   //       { first: false, last: false },
   //       { first: false, last: true },
   //       { first: false, last: true }
   //    ];

   //    const addTiles = {
   //       0: this.#tileSize,
   //       1: this.#tileShorterSize,
   //       2: this.#tileShorterSize,
   //       3: this.#tileSize,
   //       4: this.#tileSize
   //    };      
   //    let layout = this.#createAndAssertLayoutIsAsExpected(expectedLocations,
   //       expectedFirstLastInColumns, addTiles, 50);
      
   //    Assert.equivalent([3, 4], layout.getReferenceRowTileIndices());      
   //    layout.focus(0);
   //    Assert.equivalent([0, 1, 2], layout.getReferenceRowTileIndices());
   //    layout.focus(1);
   //    Assert.equivalent([0, 1, 2], layout.getReferenceRowTileIndices());
   //    layout.focus(2);
   //    Assert.equivalent([0, 1, 2], layout.getReferenceRowTileIndices());
   //    layout.focus(3);
   //    Assert.equivalent([3, 4], layout.getReferenceRowTileIndices());
   //    layout.focus(4);
   //    Assert.equivalent([3, 4], layout.getReferenceRowTileIndices());
   // }

   /**
    * 
    * @param {import("../../../Utils/RectangleUtils.js").Rectangle[]} expectedLocations 
    * @param {{first:boolean, last:boolean}[]} expectedFirstLastInColumns 
    * @param {Object.<number, import("../../../Utils/VectorUtils.js").Vector>} addTiles 
    * @param {number} [movementDistance]
    * @returns {TileGridLayout}
    */
   #createAndAssertLayoutIsAsExpected(expectedLocations, expectedFirstLastInColumns, addTiles,
      movementDistance) {
      let layout = new TileGridLayout(this.#layoutType, this.#containerSize);
      let actualLocations = [];      

      let tileIndices = Object.keys(addTiles).map(key => parseInt(key));

      let indexQueue = [...tileIndices];
      for (let tileIndex = indexQueue.shift(); tileIndex != null; tileIndex = indexQueue.shift()) {
         if (layout.canAdd(tileIndex)) {
            actualLocations[tileIndex] = layout.add(tileIndex, addTiles[tileIndex]);      
         } else if (!layout.contains(tileIndex)) {
            indexQueue.push(tileIndex);
         }
      }

      if (movementDistance == null) {
         Assert.equivalent(expectedLocations, actualLocations);
      }

      if (movementDistance != null) {
         layout.move(movementDistance);
      }
      
      for (let i = 0; i < expectedLocations.length; i++) {
         Assert.true(RU.equals(expectedLocations[i], layout.getTileLocation(i)));
         Assert.equals(expectedFirstLastInColumns[i].first, layout.isFirstInColumn(i));
         Assert.equals(expectedFirstLastInColumns[i].last, layout.isLastInColumn(i));
      }

      Assert.equals(actualLocations.length, layout.tilesCount);
      Assert.equals(tileIndices[0], layout.firstTileIndex);
      Assert.equals(tileIndices[tileIndices.length - 1], layout.lastTileIndex);
      Assert.equals(this.#containerSizeLength, layout.containerLength);

      return layout;
   }
}
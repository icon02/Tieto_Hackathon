var config = {
  type: Phaser.WEBGL,
  width: 1080,
  height: 720,

  backgroundColor: "#bfcc00",
  parent: "phaser-example",
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

var soldier1;
var soldier2;
var companion1;
var companion2;
var cursors;
var p2cursors;

//  Direction consts
var UP = 0;
var DOWN = 1;
var LEFT = 2;
var RIGHT = 3;

var game = new Phaser.Game(config);

function preload() {
  // this.load.image("food", "assets/games/snake/food.png");
  this.load.image("background", "assets/Background.png");

  this.load.image("player1", "assets/jaeger_150.png");
  this.load.image("player2", "assets/russian_150.png");
}

function create() {
  this.add.image(540, 360, "background");

  var Companion = new Phaser.Class({
    Extends: Phaser.GameObjects.Image,

    initialize: function Companion(scene, x, y, player2) {
      Phaser.GameObjects.Image.call(this, scene);
      this.player2 = player2;
      this.setTexture(player2 ? "player2" : "player1");
      this.setPosition(x * 16, y * 16);
      this.setOrigin(0);

      this.p1total = 0;
      this.p2total = 0;

      scene.children.add(this);
    },

    join: function () {
      this.player2 ? p2total-- : p1total--;
    },
  });

  var Soldier = new Phaser.Class({
    player2: false,

    initialize: function Soldier(scene, x, y, player2) {
      this.player2 = player2;
      this.headPosition = new Phaser.Geom.Point(x, y);

      this.body = scene.add.group();

      this.head = this.body.create(x * 16, y * 16, player2 ? "player2" : "player1");
      this.head.setOrigin(0);

      this.alive = true;

      this.speed = 100;

      this.moveTime = 0;

      this.tail = new Phaser.Geom.Point(x, y);

      this.heading = RIGHT;
      this.direction = RIGHT;

      this.companions = 0;

      for (let i = 0; i < 9; i++) this.grow();
    },

    update: function (time) {
      const pause = document.getElementById("pause").innerHTML;

      if (time >= this.moveTime && pause === "false") {
        return this.move(time);
      }
    },

    faceLeft: function () {
      if (this.direction === UP || this.direction === DOWN) {
        this.heading = LEFT;
      }
    },

    faceRight: function () {
      if (this.direction === UP || this.direction === DOWN) {
        this.heading = RIGHT;
      }
    },

    faceUp: function () {
      if (this.direction === LEFT || this.direction === RIGHT) {
        this.heading = UP;
      }
    },

    faceDown: function () {
      if (this.direction === LEFT || this.direction === RIGHT) {
        this.heading = DOWN;
      }
    },

    move: function (time) {
      /**
       * Based on the heading property (which is the direction the pgroup pressed)
       * we update the headPosition value accordingly.
       *
       * The Math.wrap call allow the solier to wrap around the screen, so when
       * it goes off any of the sides it re-appears on the other.
       */
      switch (this.heading) {
        case LEFT:
          this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x - 1, 0, 64);
          break;

        case RIGHT:
          this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x + 1, 0, 64);
          break;

        case UP:
          this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y - 1, 0, 42);
          break;

        case DOWN:
          this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y + 1, 0, 42);
          break;
      }

      this.direction = this.heading;

      //  Update the body segments and place the last coordinate into this.tail
      Phaser.Actions.ShiftPosition(
        this.body.getChildren(),
        this.headPosition.x * 16,
        this.headPosition.y * 16,
        1,
        this.tail,
      );

      //  Check to see if any of the body pieces have the same x/y as the head
      //  If they do, the head ran into the body

      var hitBody = Phaser.Actions.GetFirst(
        this.body.getChildren(),
        { x: this.head.x, y: this.head.y },
        1,
      );

      if (hitBody) {
        console.log("dead");

        this.alive = false;

        return false;
      } else {
        //  Update the timer ready for the next movement
        this.moveTime = time + this.speed;

        return true;
      }
    },

    grow: function () {
      this.companions++;
      var newPart = this.body.create(
        this.tail.x,
        this.tail.y,
        this.player2 ? "player2" : "player1",
      );

      newPart.setOrigin(0);
    },

    triesHire: function (companion) {
      const variance = 10;
      if (
        this.head.x >= companion.x - variance &&
        this.head.x <= companion.x + variance &&
        this.head.y >= companion.y - variance &&
        this.head.y <= companion.y + variance
      ) {
        this.grow();

        companion.join();

        //  For every 5 items of companions hired we'll increase the unit speed a little
        if (this.speed > 20 && companion.total % 5 === 0) {
          this.speed -= 5;
        }

        return true;
      } else {
        return false;
      }
    },

    updateGrid: function (grid) {
      //  Remove all body pieces from valid positions list
      this.body.children.each(function (segment) {
        var bx = segment.x / 16;
        var by = segment.y / 16;

        grid[by][bx] = false;
      });

      return grid;
    },
  });

  companion1 = new Companion(this, 3, 4, false);
  companion2 = new Companion(this, 8, 6, true);

  soldier1 = new Soldier(this, 8, 8, false);
  soldier2 = new Soldier(this, 50, 50, true);

  //  Create our keyboard controls
  p2cursors = this.input.keyboard.addKeys("W,A,S,D");
  cursors = this.input.keyboard.createCursorKeys();
  console.log("cursors", cursors);
}

function update(time, delta) {
  if (!soldier1.alive || !soldier2.alive) {
    return;
  }

  /**
   * Check which key is pressed, and then change the direction the snake
   * is heading based on that. The checks ensure you don't double-back
   * on yourself, for example if you're moving to the right and you press
   * the LEFT cursor, it ignores it, because the only valid directions you
   * can move in at that time is up and down.
   */
  if (cursors.left.isDown) {
    soldier1.faceLeft();
    // soldier2.faceLeft();
  } else if (cursors.right.isDown) {
    soldier1.faceRight();
    // soldier2.faceRight();
  } else if (cursors.up.isDown) {
    soldier1.faceUp();
    // soldier2.faceUp();
  } else if (cursors.down.isDown) {
    soldier1.faceDown();
    // soldier2.faceDown();
  }

  if (p2cursors.W.isDown) {
    soldier2.faceUp();
  } else if (p2cursors.A.isDown) {
    soldier2.faceLeft();
  } else if (p2cursors.S.isDown) {
    soldier2.faceDown();
  } else if (p2cursors.D.isDown) {
    soldier2.faceRight();
  }

  if (soldier1.update(time)) {
    if (soldier1.triesHire(companion1)) {
      repositionCompanion();
    }
  }

  if (soldier2.update(time)) {
    if (soldier2.triesHire(companion2)) {
      repositionCompanion(true);
    }
  }
}

/**
 * We can place the food anywhere in our 40x30 grid
 * *except* on-top of the snake, so we need
 * to filter those out of the possible food locations.
 * If there aren't any locations left, they've won!
 *
 * @method repositionFood
 * @return {boolean} true if the food was placed, otherwise false
 */
function repositionCompanion(player2) {
  //  First create an array that assumes all positions
  //  are valid for the new piece of food

  //  A Grid we'll use to reposition the food each time it's eaten
  var testGrid = [];

  for (var y = 0; y < 30; y++) {
    testGrid[y] = [];

    for (var x = 0; x < 40; x++) {
      testGrid[y][x] = true;
    }
  }

  soldier1.updateGrid(testGrid);
  soldier2.updateGrid(testGrid);

  //  Purge out false positions
  var validLocations = [];

  for (var y = 0; y < 30; y++) {
    for (var x = 0; x < 40; x++) {
      if (testGrid[y][x] === true) {
        //  Is this position valid for food? If so, add it here ...
        validLocations.push({ x: x, y: y });
      }
    }
  }

  if (validLocations.length > 0) {
    //  Use the RNG to pick a random food position
    var pos = Phaser.Math.RND.pick(validLocations);

    //  And place it
    if (player2) companion2.setPosition(pos.x * 16, pos.y * 16);
    else companion1.setPosition(pos.x * 16, pos.y * 16);

    return true;
  } else {
    return false;
  }
}

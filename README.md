svgTrinusifier
========
A command line utility for converting SVG files to Trinus Laser Gcode using [Gcanvas](https://github.com/em/gcanvas) and [canvg](https://code.google.com/p/canvg/).

### Disclaimer
This is an attempt to figure out a way to control our machine (Kodama Trinus) with vectors - and it's not perfect. There are still weird, unexpected things happening at times. This solution is pretty much a *hack*. Until there's no official documentation (I doubt if there'll ever be one), every bit of this solution is basically a workaround or a guess. Use at your own risk. Always wear your safety goggles while operating the laser - anyone else present in the room should also wear their goggles while the laser is working!
Any comments and updates to this project are welcome! This is my first node.js project so anyone with more experience, feel free to update anything. We'd appreciate it ;)

### Installation, Steps
You'll need [nodejs](http://nodejs.org) installed.

Clone this repository to a local folder - `git clone https://github.com/zsoltmar/svgTrinusifier.git`

Run `npm install` to install dependencies.

Copy (and overwrite) `bin/motion.js` to `node_modules/gcanvas/lib/motion.js`

Go to the `bin` folder (`$ cd bin`) and run test example:

`node svgGcoder ../test/arcs.svg -z 103.2 | node gcodeTrinusifier > ../test/arcs.gcode -m 5400 -l 300`


### Usage
```
  Usage: node svgGcoder <file> [options] | node gcodeTrinusifier > <output.gcode> [options]

  Options:

    -h, --help					Usage information
    -V, --version				Version number
   
   svgGcoder: 
    -z, --zheight <number>		Z height (focused laser + material height in mm) ex.103.2
   
   gcodeTrinusifier:
    -m, --move <number>			Movement speed (mm/minute) default:5400
    -l, --laser <number>		Laser speed (mm/minute) default:300

```

### Notes & Tips
- Run test example (see above) - you should get a gcode file in the test directory. You can comapre it to the one in the /gen folder. The outer circle is to preview the default interpolation, second circle is a smoother one with added points. The spirals are an example of curved lines that are interpolated with more inbetween points.
- Use one of the test SVG files as a starting point. They're sized to the max area of the Trinus (120mmx125mm). Make sure to save as SVG ver 1.0
- X axis on the Trinus needs a recalibration of about 6mm to the left for the laser to be at X0 on the edge of the buildplate - 3d print an offset head is a good option
- Focus your laser at 100mm on the Z-axis (G0 Z100) and then measure your material's height and add it to 100. For example if a block of wood has the height of 7.43mm then your option will look like this: `-z 107.43`
- If you don't intend to change the height and don't want the leaser head to home on the Z axis after the first print, remove the 4th line in the gcode (`G0 Z103.2`) and change the 3rd line to (`G28 XY`)
- There's no automatic fill generation (yet), you'll have to do it yourself in your SVG file. Think in lines - like how would you fill in an area with a ballpoint pen.
- If you want deeper cuts, simply create copies of the line in your SVG on top of itself, or run multiple passes of the same file
- Arcs and circles are interpolated (turned into lines) - if you want to have more resolution for curves, simply add more intermitent points
- For features smaller than 1mm it's a good idea to turn your vector art to straight lines not shorter than 0.1mm instead of curves
- There's no movement optimization - arrange your layers according to how you want the draw progression to be. Bottom layers come first, top ones come last.
- You can use your SD card with the generated gcode copied and renamed to `autoprint.gcode` - or use OctoPrint with the "Grbl support" plugin installed.

### To Dos
- combine commands into one - svgTrinusifier [options] <file ...>
- better way to handle the motion.js file update
- throw errors if there are any
- build a web interface for better usability
- build a simulator / gcode viewer
- create fill pattern library
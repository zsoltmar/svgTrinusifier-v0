svgTrinusifier
========
A command line utility for converting SVG files to Trinus Laser Gcode using [Gcanvas](https://github.com/em/gcanvas) and [canvg](https://code.google.com/p/canvg/).

### Disclaimer
This is a hack. There's no official documentation nor any sort of support from the Kodama/Panowin team. This is an attempt to figure out a way to control our machine with vectors - and it's not perfect. There are still weird, unexpected things happening at times. Until there's no official documentation (I doubt if there'll ever be one), every bit of this solution is basically a workaround or a guess. Use at your own risk.
Any comments and updates to this project are welcome!

### Installation
You'll need [nodejs](http://nodejs.org) installed.
Run `npm install` to install dependencies.
Go to the `bin` folder ('cd bin') and run script.

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

Sample: `node svgGcoder ../folder/input.svg -z 103.2 | node gcodeTrinusifier > ../folder/output.gcode -m 5400 -l 300`

Example: `node svgGcoder ../test/arcs.svg -z 103.2 | node gcodeTrinusifier > ../test/arcs.gcode -m 5400 -l 300`

### Notes & Tips
- X axis on the Trinus needs a recalibration of about 6mm to the left for the laser to be at X0 on the edge of the buildplate - 3d print an offset head is a good option
- Focus your laser at 100mm on the Z-axis (G0 Z100)
- Measure your material's height and add it to 100. For example if a block of wood has the height of 7.43mm then your option will look like this: `-z 107.43`
- There's no automatic fill generation, you'll have to do it yourself in your SVG file. Think in lines
- For features smaller than 1mm turn your vector art to straight lines not shorter than 0.1mm instead of curves
- If you use circles, make sure to expand the shape before converting. Currently not supporting G3 and G2 arcs on the Trinus.
- There's no movement optimization - arrange your layers according to how you want the draw progression to be. Bottom layers come first, top comes last.

### To Dos
- combine commands into one - svgTrinusifier [options] <file ...>
- fix arcs
- build a web interface for better usability
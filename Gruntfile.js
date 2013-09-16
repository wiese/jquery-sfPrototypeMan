/*jshint node: true */

"use strict";

module.exports = function (grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		qunit: {
			all: ["test/index.html"]
		},
		jshint: {
			files: [
				"Gruntfile.js",
				"jquery.sfprototypeman.js"
			],
			options: {
				jshintrc: ".jshintrc"
			}
		},
		uglify: {
			options: {
				banner: "/*! <%= pkg.name %> v<%= pkg.version %> | <%= _.pluck(pkg.licenses, 'type').join(', ') %> */\n"
			},
			build: {
				files: {
					"build/jquery.sfprototypeman.min.js": "jquery.sfprototypeman.js"
				}
			}
		},
		watch: {
			files: [
				"jquery.sfprototypeman.js",
				"test/tests.js"
			],
			tasks: "default"
		},
		compare_size: {
			files: [
				"build/jquery.sfprototypeman.min.js",
				"jquery.sfprototypeman.js"
			],
			options: {
				compress: {
					gz: function (fileContents) {
						return require("gzip-js").zip(fileContents, {}).length;
					}
				}
			}
		}
	});

	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-qunit");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-compare-size");

	grunt.registerTask("default", ["jshint", "qunit", "uglify", "compare_size"]);
	grunt.registerTask("ci", ["jshint", "qunit"]);
};

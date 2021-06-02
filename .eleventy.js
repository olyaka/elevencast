const fs = require('fs');
const htmlmin = require('html-minifier');
const music = require('music-metadata');
const prettydata = require('pretty-data');

module.exports = (config) => {
  // Audio Data Filters

  config.addFilter('length', (path) => {
    const stats = fs.statSync(path);

    return stats.size;
  });

  const getDuration = (path) => {
    return music.parseFile(path)
      .then(metadata => {
        const duration = parseFloat(metadata.format.duration);
        return new Date(Math.ceil(duration) * 1000).toISOString().substr(11, 8);
      })
      .catch(error => {
        console.log(error);
      });
  }

  config.addNunjucksAsyncFilter('duration', async (path, callback) => {
    const duration = await getDuration(path);

    callback(null, duration);
  });

  // HTML Minification

  config.addFilter('htmlmin', (value) => {
    return htmlmin.minify(
      value, {
        removeComments: true,
        collapseWhitespace: true
      }
    );
  });

  config.addTransform('htmlmin', (content, outputPath) => {
    if(outputPath && outputPath.endsWith('.html')) {
      const result = htmlmin.minify(
        content, {
          removeComments: true,
          collapseWhitespace: true
        }
      );

      return result;
    }

    return content;
  });

  // XML Minification for RSS

  config.addTransform('xmlmin', (content, outputPath) => {
    if(outputPath && outputPath.endsWith('.xml')) {
      return prettydata.pd.xmlmin(content);
    }

    return content;
  });

  // Passthrough Copy

  config.addPassthroughCopy('src/images');
  config.addPassthroughCopy('src/episodes/**/*.mp3');

  // Config

  return {
    dir: {
      input: 'src',
      output: 'dist',
      includes: 'includes',
      layouts: 'layouts',
      data: 'data'
    },
    dataTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    templateFormats: [
      'md', 'njk'
    ],
  };
};

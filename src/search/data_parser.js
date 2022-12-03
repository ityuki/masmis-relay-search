
var Moment = require('moment')

var perser = function(text){
  if (text == "" || text == null || text == undefined){
    text = ""
  }
  this.text = text
  this.cur_str = text.split('')
  this.str_buf = []
}

perser.prototype.ungetsym = function(ident){
  this.str_buf.push(ident)
}

perser.prototype.getsym = function(){
  if (this.str_buf.length > 0){
    return this.str_buf.pop()
  }
  var ident = ""
  var in_dq = false
  while (this.cur_str.length > 0){
    var c = this.cur_str.shift()
    if (in_dq){
      if (c == '"'){
        return ident // ident == "" OK
      }
      ident += c
    }else{
      if (ident == ""){
        if (c == "+") return c
        if (c == "-") return c
        if (c == ":") return c
        if (c == '"'){
          in_dq = true
          continue // start "
        }
        if (c == " " || c == "　") continue // split
        ident += c
      }else{
        if (c == ":"){
          this.cur_str.unshift(c)
          return ident
        }
        if (c == " " || c == "　"){
          // split
          return ident
        }
        ident += c
      }
    }
  }
  if (ident == ""){
    return null
  }
  return ident
}

perser.prototype.like_escape = function(text){
  text = text.replaceAll("\\\\", "\\\\\\\\")
  text = text.replaceAll("%", "\\\\%")
  text = text.replaceAll("_", "\\\\\_")
  return text
}
perser.prototype.param_boolean = function(text){
  var l = text.toLowerCase()
  return l == "t" || l == "true" || l == "y" || l == "yes" || l == 'on'
}

perser.prototype.build_where = function(){
  var where_str = ""
  var where_str_next = ""
  var where_param = []
  var sym = this.getsym()
  var is_not = false
  var is_or = false
  var search_tag = false;
  while(sym && sym != null){
    is_not = false;
    is_or = false;
    var opt_loop = true;
    while(opt_loop && sym && sym != null){
      switch(sym){
        case "+": is_not = false; sym = this.getsym(); break;
        case "-": is_not = true; sym = this.getsym(); break
        case "OR": is_or = true; sym = this.getsym(); break
        case "AND": is_or = false; sym = this.getsym(); break
        default: opt_loop = false;
      }
    }
    if (!sym && sym == null) break;
    if (where_str != ""){
      if (is_or){
        where_str_next = " OR "
      }else{
        where_str_next = " AND "
      }
    }else{
      // only AND
      where_str_next = ""
    }
    var nextsym = this.getsym()
    if (nextsym == ":"){
      // parameter
      nextsym = this.getsym()
      if (nextsym == null){
        // text search
        where_str += where_str_next + " notes.note " + (is_not? "NOT ": "") + "like ?"
        where_param.push("%" + this.like_escape(sym) + ":" + "%") 
        sym = nextsym   
        continue;
      }
      switch(sym){
        case 'account.domain':
          where_str += where_str_next + " notes_accounts.domain " + (!is_not? "= ": "!= ") + "?"
          where_param.push(nextsym)
          break;
        case 'account.domain.prefix':
          where_str += where_str_next + " notes_accounts.domain " + (!is_not? "": "NOT ") + "like ?"
          where_param.push(this.like_escape(nextsym) + "%")
          break;
        case 'account.username':
          where_str += where_str_next + " notes_accounts.username " + (!is_not? "= ": "!= ") + "?"
          where_param.push(nextsym)
          break;
        case 'account.username.prefix':
          where_str += where_str_next + " notes_accounts.username " + (!is_not? "": "NOT ") + "like ?"
          where_param.push(this.like_escape(nextsym) + "%")
          break;
        case 'account.display_name':
          where_str += where_str_next + " notes_accounts.display_name " + (!is_not? "= ": "!= ") + "?"
          where_param.push(nextsym)
          break;
        case 'account.display_name.prefix':
          where_str += where_str_next + " notes_accounts.display_name " + (!is_not? "": "NOT ") + "like ?"
          where_param.push(this.like_escape(nextsym) + "%")
          break;
        case 'account.bot':
          where_str += where_str_next + " notes_accounts.bot " + (!is_not? "= ": "!= ") + "?"
          where_param.push(this.param_boolean(nextsym))
          break;
        case 'tag':
          where_str += where_str_next + " tags.name " + (!is_not? "= ": "!= ") + "?"
          where_param.push(nextsym)
          search_tag = true;
          break;
        case 'tag.prefix':
          where_str += where_str_next + " tags.name " + (!is_not? "": "NOT ") + "like ?"
          where_param.push(this.like_escape(nextsym) + "%")
          search_tag = true;
          break;
        case 'sensitive':
          where_str += where_str_next + " notes.sensitive " + (!is_not? "= ": "!= ") + "?"
          where_param.push(this.param_boolean(nextsym))
          break;
        case 'has_media':
          where_str += where_str_next + " notes.media_attachments " + (!is_not? "= ": "!= ") + "?"
          where_param.push(this.param_boolean(nextsym))
          break;
        case 'language':
          if (nextsym == "NULL"){
            where_str += where_str_next + " notes.language " + (!is_not? "IS ": "IS NOT ") + "NULL"
          }else{
            where_str += where_str_next + " notes.language " + (!is_not? "= ": "!= ") + "?"
            where_param.push(nextsym)
          }
          break;
        case 'application_name':
          if (nextsym == "NULL"){
            where_str += where_str_next + " notes.application_name " + (!is_not? "IS ": "IS NOT ") + "NULL"
          }else{
            where_str += where_str_next + " notes.application_name " + (!is_not? "= ": "!= ") + "?"
            where_param.push(nextsym)
          }
          break;
        case 'start_at':
          where_str += where_str_next + " notes.note_created_at " + (!is_not? ">= ": "< ") + "?"
          where_param.push(Moment(nextsym).toISOString())
          break;
        case 'end_at':
          where_str += where_str_next + " notes.note_created_at " + (!is_not? "<= ": "> ") + "?"
          where_param.push(Moment(nextsym).toISOString())
          break;
        default:
          // text search
          where_str += where_str_next + " notes.note " + (is_not? "NOT ": "") + "like ?"
          where_param.push("%" + this.like_escape(sym) + ":" + this.like_escape(nextsym) + "%")    
      }
      add_not = ""
      is_or = false
      sym = this.getsym()
    }else{
      // text
      where_str += where_str_next + " notes.note " + (is_not? "NOT ": "") + "like ?"
      where_param.push("%" + this.like_escape(sym) + "%")
      add_not = ""
      is_or = false
      sym = nextsym
    }
  }
  if (where_str == ""){
    return null
  }
  return {
    sql: where_str,
    params: where_param,
    search_tag: search_tag
  }
}

module.exports = {
  parseInput : function (text){
    return (new perser(text)).build_where();
  }
};

